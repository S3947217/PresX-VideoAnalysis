"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, Pause, Play, RotateCcw, RefreshCw, X } from "lucide-react";
import { exportWAV, MIN_DURATION, MAX_DURATION, TARGET_SAMPLE_RATE, downsample } from "@/lib/audioUtils";
import {
  saveRecordingBatch,
  updateRecordingMeta,
  loadRecordingDraft,
  clearRecordingDraft,
} from "@/lib/sessionDraft";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
  sessionKey: string;
}

const AUTO_SAVE_INTERVAL_MS = 5000;

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  isProcessing,
  sessionKey,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recoverableTime, setRecoverableTime] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioBuffersRef = useRef<Float32Array[]>([]);
  const isPausedRef = useRef(false);
  const stopRecordingRef = useRef<() => void>(() => {});

  // Wall-clock timing — single source of truth, no race conditions
  const startTimestampRef = useRef(0);       // Date.now() when current segment started
  const accumulatedMsRef = useRef(0);        // ms accumulated from previous segments (pauses, resume)
  const displayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save refs
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedChunkIndexRef = useRef(0);
  const batchCountRef = useRef(0);

  /** Compute elapsed seconds from audio data (ground truth for persistence). */
  const getAudioDuration = useCallback(() => {
    let totalSamples = 0;
    for (const c of audioBuffersRef.current) totalSamples += c.length;
    return totalSamples / TARGET_SAMPLE_RATE;
  }, []);

  /** Compute elapsed seconds from wall clock (ground truth for display & limits). */
  const getElapsedSeconds = useCallback(() => {
    if (isPausedRef.current) return Math.floor(accumulatedMsRef.current / 1000);
    return Math.floor((accumulatedMsRef.current + Date.now() - startTimestampRef.current) / 1000);
  }, []);

  /** Start the display timer that reads from wall clock. */
  const startDisplayTimer = useCallback(() => {
    if (displayTimerRef.current) clearInterval(displayTimerRef.current);
    displayTimerRef.current = setInterval(() => {
      setRecordingTime(getElapsedSeconds());
    }, 500); // 500ms for smooth updates without overhead
  }, [getElapsedSeconds]);

  /** Stop the display timer. */
  const stopDisplayTimer = useCallback(() => {
    if (displayTimerRef.current) {
      clearInterval(displayTimerRef.current);
      displayTimerRef.current = null;
    }
  }, []);

  const getAudioContext = () => {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error("AudioContext is not supported in this browser.");
    }
    return new AudioContextCtor();
  };

  // ── Auto-save helpers ──

  const flushChunksToIDB = useCallback(async (completed: boolean) => {
    const chunks = audioBuffersRef.current;
    const start = lastSavedChunkIndexRef.current;
    const newChunks = chunks.slice(start);

    // Compute actual duration from audio data (ground truth)
    const actualTime = Math.round(getAudioDuration());

    if (newChunks.length > 0) {
      // Merge new ScriptProcessor chunks into one Float32Array batch
      let totalLen = 0;
      for (const c of newChunks) totalLen += c.length;
      const merged = new Float32Array(totalLen);
      let off = 0;
      for (const c of newChunks) { merged.set(c, off); off += c.length; }

      const batchIndex = batchCountRef.current;
      await saveRecordingBatch(sessionKey, batchIndex, merged, {
        sampleRate: TARGET_SAMPLE_RATE,
        recordingTime: actualTime,
        batchCount: batchIndex + 1,
        completed,
      });
      batchCountRef.current = batchIndex + 1;
      lastSavedChunkIndexRef.current = chunks.length;
    } else if (completed && batchCountRef.current > 0) {
      // No new audio data but need to mark as completed
      await updateRecordingMeta(sessionKey, {
        sampleRate: TARGET_SAMPLE_RATE,
        recordingTime: actualTime,
        batchCount: batchCountRef.current,
        completed: true,
      });
    }
  }, [sessionKey, getAudioDuration]);

  const startAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(() => {
      flushChunksToIDB(false).catch((err) =>
        console.error("Auto-save failed:", err)
      );
    }, AUTO_SAVE_INTERVAL_MS);
  }, [flushChunksToIDB]);

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // ── Check for recoverable recording on mount ──

  useEffect(() => {
    loadRecordingDraft(sessionKey).then((draft) => {
      if (!draft || draft.batches.length === 0) return;

      if (draft.meta.completed) {
        // Recording was completed before crash — reconstruct blob and deliver
        const blob = exportWAV(draft.batches, draft.meta.sampleRate);
        onRecordingComplete(blob);
      } else {
        // Recording was mid-progress — offer to resume
        setRecoverableTime(draft.meta.recordingTime);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  // ── Cleanup ──

  const stopRecordingCleanup = useCallback(() => {
    stopDisplayTimer();
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    stopAutoSave();
  }, [stopAutoSave, stopDisplayTimer]);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, [stopRecordingCleanup]);

  // ── Start recording (fresh or resumed from saved buffers) ──

  const beginRecording = async (initialBuffers?: Float32Array[], initialTime?: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = getAudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      // If resuming, keep the recovered buffers; otherwise start fresh
      audioBuffersRef.current = initialBuffers || [];
      lastSavedChunkIndexRef.current = initialBuffers?.length || 0;
      batchCountRef.current = initialBuffers?.length || 0;
      isPausedRef.current = false;

      const nativeSampleRate = audioContext.sampleRate;
      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const chunk = downsample(new Float32Array(inputData), nativeSampleRate, TARGET_SAMPLE_RATE);
        audioBuffersRef.current.push(chunk);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Wall-clock timing setup
      const startSeconds = initialTime || 0;
      accumulatedMsRef.current = startSeconds * 1000;
      startTimestampRef.current = Date.now();

      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(startSeconds);
      setAudioUrl(null);
      setRecoverableTime(null);

      startDisplayTimer();

      const remainingMs = MAX_DURATION * 1000 - accumulatedMsRef.current;
      if (remainingMs > 0) {
        maxDurationTimeoutRef.current = setTimeout(() => {
          stopRecordingRef.current();
        }, remainingMs);
      }

      // Start auto-saving chunks every 5 seconds
      startAutoSave();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow permissions.");
    }
  };

  const startRecording = async () => {
    // Fresh recording — clear any leftover saved data for this key
    await clearRecordingDraft(sessionKey).catch(() => {});
    beginRecording();
  };

  const resumeFromSaved = async () => {
    const draft = await loadRecordingDraft(sessionKey);
    if (!draft || draft.batches.length === 0) {
      // Nothing to recover — start fresh
      startRecording();
      return;
    }
    // Continue recording from where we left off
    beginRecording(draft.batches, draft.meta.recordingTime);
  };

  const discardSaved = async () => {
    await clearRecordingDraft(sessionKey).catch(() => {});
    setRecoverableTime(null);
  };

  // ── Pause / Resume / Restart ──

  const pauseRecording = useCallback(() => {
    if (!isRecording || isPaused) return;
    isPausedRef.current = true;
    setIsPaused(true);

    // Accumulate elapsed time and stop timers
    accumulatedMsRef.current += Date.now() - startTimestampRef.current;
    stopDisplayTimer();
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Flush whatever we have so far
    flushChunksToIDB(false).catch(() => {});
  }, [isRecording, isPaused, flushChunksToIDB, stopDisplayTimer]);

  const resumeRecording = useCallback(() => {
    if (!isRecording || !isPaused) return;
    isPausedRef.current = false;
    setIsPaused(false);

    // Restart wall clock from current accumulated time
    startTimestampRef.current = Date.now();
    startDisplayTimer();

    const remainingMs = MAX_DURATION * 1000 - accumulatedMsRef.current;
    if (remainingMs > 0) {
      maxDurationTimeoutRef.current = setTimeout(() => {
        stopRecordingRef.current();
      }, remainingMs);
    }
  }, [isRecording, isPaused, startDisplayTimer]);

  const restartRecording = useCallback(() => {
    if (!isRecording) return;
    // Clear saved chunks and start fresh
    clearRecordingDraft(sessionKey).catch(() => {});
    audioBuffersRef.current = [];
    lastSavedChunkIndexRef.current = 0;
    batchCountRef.current = 0;
    isPausedRef.current = false;

    // Reset wall clock
    accumulatedMsRef.current = 0;
    startTimestampRef.current = Date.now();
    setIsPaused(false);
    setRecordingTime(0);

    stopDisplayTimer();
    startDisplayTimer();

    if (maxDurationTimeoutRef.current) clearTimeout(maxDurationTimeoutRef.current);
    maxDurationTimeoutRef.current = setTimeout(() => {
      stopRecordingRef.current();
    }, MAX_DURATION * 1000);
  }, [isRecording, sessionKey, stopDisplayTimer, startDisplayTimer]);

  // ── Stop ──

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    // Use audio data as ground truth for duration check
    const actualDuration = getAudioDuration();
    if (actualDuration < MIN_DURATION) {
      alert(`Recording must be at least ${MIN_DURATION} seconds long.`);
      setIsRecording(false);
      setIsPaused(false);
      stopRecordingCleanup();
      clearRecordingDraft(sessionKey).catch(() => {});
      return;
    }

    setIsRecording(false);
    setIsPaused(false);
    stopRecordingCleanup();

    // Final flush — mark as completed so crash recovery can reconstruct the blob
    await flushChunksToIDB(true).catch(() => {});

    const blob = exportWAV(audioBuffersRef.current, TARGET_SAMPLE_RATE);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    onRecordingComplete(blob);
  }, [isRecording, onRecordingComplete, getAudioDuration, stopRecordingCleanup, flushChunksToIDB, sessionKey]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Recovery UI ──

  if (recoverableTime !== null && !isRecording) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-6xl font-display font-bold text-white tracking-tighter">
          {formatTime(recoverableTime)}
        </div>
        <p className="text-sm text-yellow-400 uppercase tracking-widest font-medium">
          Previous recording found
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={resumeFromSaved}
            className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white text-white hover:bg-white hover:text-black transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Resume
          </button>
          <button
            onClick={discardSaved}
            className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white/30 text-gray-400 hover:text-white hover:border-white/60 transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <X className="w-4 h-4" />
            Discard
          </button>
        </div>
      </div>
    );
  }

  // ── Normal UI ──

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="text-6xl font-display font-bold text-white tracking-tighter">
        {formatTime(recordingTime)}
      </div>

      <div className="flex items-center gap-6">
        {isRecording && (
          <button
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-white/30 text-white hover:bg-white/10 transition-colors"
            aria-label={isPaused ? "Resume recording" : "Pause recording"}
          >
            {isPaused ? (
              <Play className="w-6 h-6 ml-0.5" />
            ) : (
              <Pause className="w-6 h-6" />
            )}
          </button>
        )}

        <div className="relative">
          {isRecording && !isPaused && (
            <div className="absolute inset-0 rounded-full bg-accent-red animate-ping opacity-50"></div>
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 border-2 ${isRecording
              ? "bg-accent-red border-accent-red hover:bg-purple-700"
              : "bg-transparent border-white hover:bg-white hover:text-black"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isRecording ? (
              <Square className="w-10 h-10 fill-current" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {isRecording && (
          <button
            onClick={restartRecording}
            className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-white/30 text-white hover:bg-white/10 transition-colors"
            aria-label="Restart recording"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
      </div>

      {audioUrl && !isRecording && !isProcessing && (
        <div className="mt-4">
          <audio controls src={audioUrl} className="w-64" />
          <p className="text-xs text-gray-400 mt-2 text-center uppercase tracking-widest">Preview Recording</p>
        </div>
      )}

      <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">
        {isProcessing
          ? "Analyzing..."
          : isRecording
            ? (isPaused ? "Paused" : "Recording...")
            : "Tap to Record"}
      </p>
    </div>
  );
};

export default AudioRecorder;
