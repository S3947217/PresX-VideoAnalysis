"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2, ArrowLeft, Trash2, CheckCircle2, Upload, Play, Pause } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import { getProject, saveProject, updateProject, getPresignedUrl, uploadToS3, analyzeAudioAsync, getSubscriptionStatus, ApiError } from "@/lib/api";
import { Project, AnalysisResult, CriterionKey, AnalysisRun } from "@/types/project";
import { processMediaFile, trimAudioBlob, MIN_DURATION, MAX_DURATION } from "@/lib/audioUtils";
import { CRITERIA, CRITERIA_KEYS } from "@/lib/criteria";
import { useSubscription } from "@/context/SubscriptionContext";
import { saveFormDraft, loadFormDraft, clearFormDraft, clearRecordingDraft } from "@/lib/sessionDraft";

// Context constants removed in favor of open text input

export default function NewProjectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get("projectId");
    const sessionKey = projectIdParam || "new";
    const { subscription, refresh } = useSubscription();
    const [step, setStep] = useState<1 | 2>(projectIdParam ? 2 : 1);
    const [name, setName] = useState("");
    const [purpose, setPurpose] = useState("");
    const [audience, setAudience] = useState("");
    const [topic, setTopic] = useState("");
    const [existingProjectId, setExistingProjectId] = useState<string | null>(null);
    const [existingProject, setExistingProject] = useState<Project | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [trimError, setTrimError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
    const [draggingHandle, setDraggingHandle] = useState<"start" | "end" | "range" | null>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [selectedCriteria, setSelectedCriteria] = useState<CriterionKey[]>([...CRITERIA_KEYS]);
    const [useCustomCriteria, setUseCustomCriteria] = useState(false);
    const [restoredFromDraft, setRestoredFromDraft] = useState(false);
    const draftReadyRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const trimWaveformRef = useRef<HTMLDivElement | null>(null);
    const dragOffsetRef = useRef(0);
    const pointerDownTargetRef = useRef<"background" | "range" | "start" | "end" | "playhead" | null>(null);
    const rafRef = useRef<number | null>(null);
    const [waveformWidth, setWaveformWidth] = useState(0);
    const isRetry = Boolean(existingProjectId);

    useEffect(() => {
        if (!projectIdParam) {
            setExistingProjectId(null);
            setExistingProject(null);
            setStep(1);
            return;
        }
        // Loading an existing project (retry) — clear any form draft
        clearFormDraft(sessionKey);
        draftReadyRef.current = true;
        getProject(projectIdParam).then((existing) => {
            if (!existing) {
                setExistingProjectId(null);
                setExistingProject(null);
                setStep(1);
                return;
            }
            setExistingProject(existing);
            setExistingProjectId(existing.id);
            setName(existing.name || "");
            setPurpose(existing.purpose || "");
            setAudience(existing.audience || "");
            setTopic(existing.topic || "");
            setStep(2);
        });
    }, [projectIdParam]);

    // Restore form draft from localStorage on fresh /new page load
    useEffect(() => {
        if (projectIdParam) return; // skip for retry projects
        const draft = loadFormDraft(sessionKey);
        if (draft) {
            setName(draft.name);
            setPurpose(draft.purpose);
            setAudience(draft.audience);
            setTopic(draft.topic);
            setSelectedCriteria(draft.selectedCriteria);
            setUseCustomCriteria(draft.useCustomCriteria);
            if (draft.step === 2) setStep(2);
            setRestoredFromDraft(true);
        }
        draftReadyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-save form fields to localStorage whenever relevant state changes
    useEffect(() => {
        if (!draftReadyRef.current) return;
        if (existingProjectId) return;
        if (!name.trim()) return;
        saveFormDraft(sessionKey, {
            name, purpose, audience, topic,
            selectedCriteria,
            useCustomCriteria,
            step,
        });
    }, [name, purpose, audience, topic, selectedCriteria, useCustomCriteria, step, existingProjectId, sessionKey]);

    // Warn before leaving page if there's a recording
    useEffect(() => {
        if (!audioBlob) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [audioBlob]);

    const handleNext = () => {
        if (name.trim()) setStep(2);
    };

    const setCurrentAudio = (blob: Blob | null) => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentTime(0);
        setDraggingHandle(null);
        setIsScrubbing(false);
        pointerDownTargetRef.current = null;
        if (!blob) {
            setAudioBlob(null);
            setAudioUrl(null);
            setWaveformPeaks([]);
            return;
        }
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
    };

    const handleRecordingComplete = (blob: Blob) => {
        setCurrentAudio(blob);
    };

    const toggleCriterion = (key: CriterionKey) => {
        setSelectedCriteria((prev) => {
            if (prev.includes(key)) return prev.filter((item) => item !== key);
            return [...prev, key];
        });
    };

    const selectAllCriteria = () => {
        setSelectedCriteria([...CRITERIA_KEYS]);
    };

    const clearAllCriteria = () => {
        setSelectedCriteria([]);
    };

    const toggleCustomCriteria = () => {
        setUseCustomCriteria((prev) => {
            const next = !prev;
            if (next && selectedCriteria.length === 0) {
                setSelectedCriteria([...CRITERIA_KEYS]);
            }
            return next;
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const blob = await processMediaFile(file);
            setCurrentAudio(blob);
        } catch (error: any) {
            alert(error.message);
            console.error(error);
        } finally {
            setIsProcessing(false);
            // Reset input
            e.target.value = "";
        }
    };

    const handleRetake = async () => {
        await clearRecordingDraft(sessionKey).catch(() => {});
        setCurrentAudio(null);
        setAudioDuration(0);
        setTrimStart(0);
        setTrimEnd(0);
        setTrimError(null);
    };

    const handleAudioMetadata = (event: React.SyntheticEvent<HTMLAudioElement>) => {
        const duration = event.currentTarget.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;
        setAudioDuration(duration);
        setTrimStart(0);
        setTrimEnd(duration);
        setTrimError(null);
    };

    const MIN_TRIM_SELECTION = 1;

    const getTrimTimeFromClientX = (clientX: number) => {
        if (!trimWaveformRef.current || audioDuration <= 0) return 0;
        const rect = trimWaveformRef.current.getBoundingClientRect();
        const percent = (clientX - rect.left) / rect.width;
        const clamped = Math.max(0, Math.min(1, percent));
        return clamped * audioDuration;
    };

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const scrubToClientX = (clientX: number) => {
        if (!audioRef.current || audioDuration <= 0) return;
        const time = clamp(getTrimTimeFromClientX(clientX), trimStart, trimEnd);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const updateTrimStart = (time: number) => {
        const maxStart = Math.max(0, trimEnd - MIN_TRIM_SELECTION);
        setTrimStart(clamp(time, 0, maxStart));
    };

    const updateTrimEnd = (time: number) => {
        const minEnd = Math.min(audioDuration, trimStart + MIN_TRIM_SELECTION);
        setTrimEnd(clamp(time, minEnd, audioDuration));
    };

    const handleWaveformPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (audioDuration <= 0) return;
        pointerDownTargetRef.current = "background";
        setDraggingHandle(null);
        scrubToClientX(event.clientX);
        if (trimWaveformRef.current) {
            trimWaveformRef.current.setPointerCapture(event.pointerId);
        }
    };

    const handleWaveformPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (audioDuration <= 0) return;
        if (isScrubbing || pointerDownTargetRef.current === "playhead") {
            scrubToClientX(event.clientX);
            return;
        }
        const time = getTrimTimeFromClientX(event.clientX);
        if (draggingHandle === "start") {
            updateTrimStart(time);
            return;
        }
        if (draggingHandle === "end") {
            updateTrimEnd(time);
            return;
        }
        if (draggingHandle === "range") {
            const selectionDuration = Math.max(MIN_TRIM_SELECTION, trimEnd - trimStart);
            const maxStart = Math.max(0, audioDuration - selectionDuration);
            const nextStart = clamp(time - dragOffsetRef.current, 0, maxStart);
            setTrimStart(nextStart);
            setTrimEnd(nextStart + selectionDuration);
            return;
        }
        if (pointerDownTargetRef.current === "background") {
            scrubToClientX(event.clientX);
        }
    };

    const handleWaveformPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        pointerDownTargetRef.current = null;
        setDraggingHandle(null);
        setIsScrubbing(false);
        dragOffsetRef.current = 0;
        if (trimWaveformRef.current) {
            try {
                trimWaveformRef.current.releasePointerCapture(event.pointerId);
            } catch {
                // ignore
            }
        }
    };

    const handleStartHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if (audioDuration <= 0) return;
        pointerDownTargetRef.current = "start";
        setDraggingHandle("start");
        scrubToClientX(event.clientX);
        if (trimError) setTrimError(null);
        if (trimWaveformRef.current) {
            trimWaveformRef.current.setPointerCapture(event.pointerId);
        }
    };

    const handleEndHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if (audioDuration <= 0) return;
        pointerDownTargetRef.current = "end";
        setDraggingHandle("end");
        scrubToClientX(event.clientX);
        if (trimError) setTrimError(null);
        if (trimWaveformRef.current) {
            trimWaveformRef.current.setPointerCapture(event.pointerId);
        }
    };

    const handleRangePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if (audioDuration <= 0) return;
        pointerDownTargetRef.current = "range";
        setDraggingHandle("range");
        const time = clamp(getTrimTimeFromClientX(event.clientX), trimStart, trimEnd);
        scrubToClientX(event.clientX);
        dragOffsetRef.current = time - trimStart;
        if (trimError) setTrimError(null);
        if (trimWaveformRef.current) {
            trimWaveformRef.current.setPointerCapture(event.pointerId);
        }
    };

    const handlePlayheadPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if (audioDuration <= 0) return;
        pointerDownTargetRef.current = "playhead";
        setIsScrubbing(true);
        scrubToClientX(event.clientX);
        if (trimWaveformRef.current) {
            trimWaveformRef.current.setPointerCapture(event.pointerId);
        }
    };

    useEffect(() => {
        if (!trimWaveformRef.current) return;
        const element = trimWaveformRef.current;
        const update = () => {
            setWaveformWidth(element.clientWidth);
        };
        update();

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(() => update());
            observer.observe(element);
            return () => observer.disconnect();
        }

        const handleResize = () => update();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [audioDuration]);

    useEffect(() => {
        if (!audioBlob || typeof window === "undefined" || waveformWidth === 0) {
            setWaveformPeaks([]);
            return;
        }

        let cancelled = false;
        const buildWaveform = async () => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            try {
                const arrayBuffer = await audioBlob.arrayBuffer();
                const buffer = await audioContext.decodeAudioData(arrayBuffer);
                const channelData = buffer.getChannelData(0);
                const bars = Math.min(1500, Math.max(800, Math.floor(waveformWidth * 1.2)));
                const samplesPerBar = Math.max(1, Math.floor(channelData.length / bars));
                const peaks: number[] = [];
                for (let i = 0; i < bars; i++) {
                    const start = i * samplesPerBar;
                    const end = Math.min(start + samplesPerBar, channelData.length);
                    let sum = 0;
                    for (let j = start; j < end; j++) {
                        const value = channelData[j];
                        sum += value * value;
                    }
                    const rms = Math.sqrt(sum / Math.max(1, end - start));
                    peaks.push(rms);
                }
                const max = peaks.reduce((acc, val) => Math.max(acc, val), 0) || 1;
                const smoothed = peaks.map((value, index) => {
                    const prev = peaks[index - 1] ?? value;
                    const next = peaks[index + 1] ?? value;
                    return (value + prev + next) / 3;
                });
                const normalized = smoothed.map((value) => Math.pow(value / max, 0.7));
                if (!cancelled) setWaveformPeaks(normalized);
            } catch (error) {
                console.error("Failed to build waveform", error);
                if (!cancelled) setWaveformPeaks([]);
            } finally {
                audioContext.close();
            }
        };

        buildWaveform();
        return () => {
            cancelled = true;
        };
    }, [audioBlob, waveformWidth]);

    useEffect(() => {
        if (!isPlaying) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        const tick = () => {
            if (audioRef.current) {
                const time = audioRef.current.currentTime;
                if (time < trimStart) {
                    audioRef.current.currentTime = trimStart;
                    setCurrentTime(trimStart);
                } else if (time >= trimEnd) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = trimEnd;
                    setCurrentTime(trimEnd);
                    setIsPlaying(false);
                    return;
                } else {
                    setCurrentTime(time);
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [isPlaying]);

    useEffect(() => {
        if (!audioRef.current || audioDuration <= 0) return;
        if (audioRef.current.currentTime < trimStart) {
            audioRef.current.currentTime = trimStart;
            setCurrentTime(trimStart);
        }
        if (audioRef.current.currentTime > trimEnd) {
            audioRef.current.currentTime = trimEnd;
            setCurrentTime(trimEnd);
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [trimStart, trimEnd, audioDuration, isPlaying]);

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const time = audioRef.current.currentTime;
        const clampedTime = clamp(time, trimStart, trimEnd);
        if (clampedTime !== time) {
            audioRef.current.currentTime = clampedTime;
        }
        setCurrentTime(clampedTime);
    };

    const handleTogglePlayback = async () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            try {
                if (audioRef.current.currentTime < trimStart || audioRef.current.currentTime >= trimEnd) {
                    audioRef.current.currentTime = trimStart;
                    setCurrentTime(trimStart);
                }
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (error) {
                console.error("Failed to play audio", error);
            }
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleAnalyze = async () => {
        if (!audioBlob) return;
        const selectionDuration = Math.max(0, trimEnd - trimStart);
        if (selectionDuration < MIN_DURATION || selectionDuration > MAX_DURATION) {
            setTrimError(`Selection must be between ${MIN_DURATION}s and ${MAX_DURATION / 60}m.`);
            return;
        }
        if (useCustomCriteria && selectedCriteria.length === 0) {
            alert("Please select at least one feedback criterion.");
            return;
        }

        setIsProcessing(true);
        setTrimError(null);
        setAnalysisStatus(null);

        // Re-check subscription before starting analysis to avoid stale state
        try {
            const freshSub = await getSubscriptionStatus();
            if (!freshSub.canAnalyze) {
                refresh(); // sync UI
                if (freshSub.plan === "free") {
                    router.push("/checkout");
                } else {
                    setTrimError("Daily analysis limit reached. Try again tomorrow.");
                }
                setIsProcessing(false);
                return;
            }
        } catch { }

        try {
            setAnalysisStatus("trimming");
            const trimmed = await trimAudioBlob(audioBlob, trimStart, trimEnd);
            const criteriaToSend = useCustomCriteria ? selectedCriteria : CRITERIA_KEYS;

            // 1. Get presigned URL
            setAnalysisStatus("uploading");
            const { url: presignedUrl, key: s3Key } = await getPresignedUrl("audio/wav");

            // 2. Upload to S3
            await uploadToS3(presignedUrl, trimmed);

            // 3. Submit analysis job + poll for result
            const normalizedTopic = topic.trim();
            const result: AnalysisResult = await analyzeAudioAsync(
                {
                    s3Key,
                    purpose,
                    audience,
                    topic: normalizedTopic,
                    criteria: criteriaToSend,
                    projectId: existingProjectId || undefined,
                },
                (status) => setAnalysisStatus(status)
            );

            // Clear drafts — analysis succeeded
            clearFormDraft(sessionKey);
            clearRecordingDraft(sessionKey).catch(() => {});

            // For existing projects, the Lambda already saved the analysis
            // to DynamoDB — just redirect back to the project page.
            if (existingProjectId) {
                router.push(`/project/${existingProjectId}`);
                return;
            }

            // For new projects, create the project with the analysis result.
            const runCreatedAt = new Date().toISOString();
            const analysisRun: AnalysisRun = {
                id: uuidv4(),
                createdAt: runCreatedAt,
                analysis: result,
                s3Key,
            };

            const newProject = await saveProject({
                name,
                purpose,
                audience,
                topic: normalizedTopic || "",
                createdAt: runCreatedAt,
                analysis: result,
                analysisHistory: [analysisRun],
            });

            router.push(`/project/${newProject.id}`);
            refresh();
        } catch (error) {
            console.error("Error:", error);
            if (error instanceof ApiError) {
                if (error.code === "trial_expired") {
                    router.push("/checkout");
                    return;
                }
                if (error.code === "daily_limit_reached") {
                    setTrimError("Daily analysis limit reached. Try again tomorrow.");
                    refresh();
                    setIsProcessing(false);
                    setAnalysisStatus(null);
                    return;
                }
            }
            setTrimError("Failed to process recording. Please try again.");
            setIsProcessing(false);
            setAnalysisStatus(null);
        }
    };

    const existingHistory = (() => {
        if (!existingProject) return [];
        if (Array.isArray(existingProject.analysisHistory) && existingProject.analysisHistory.length > 0) {
            return existingProject.analysisHistory;
        }
        if (existingProject.analysis) {
            return [{ id: `legacy-${existingProject.id}`, createdAt: existingProject.createdAt, analysis: existingProject.analysis }];
        }
        return [];
    })();
    const nextAttemptNumber = isRetry ? Math.max(1, existingHistory.length + 1) : null;
    const latestRun = existingHistory.length > 0 ? existingHistory[existingHistory.length - 1] : null;

    const hasCriteria = selectedCriteria.length > 0;
    const selectionDuration = Math.max(0, trimEnd - trimStart);
    const selectionValid = selectionDuration >= MIN_DURATION && selectionDuration <= MAX_DURATION;
    const subCanAnalyze = subscription?.canAnalyze ?? false;
    const canAnalyze = subCanAnalyze && (!useCustomCriteria || hasCriteria) && selectionValid;
    const isBusy = isProcessing;
    const criteriaSelectionDisabled = isBusy;
    const dailyUsed = subscription?.dailyAnalysesUsed ?? 0;
    const dailyLimit = subscription?.dailyAnalysesLimit ?? 5;
    const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

    const formatTime = (seconds: number) => {
        if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const startPercent = audioDuration > 0 ? (trimStart / audioDuration) * 100 : 0;
    const endPercent = audioDuration > 0 ? (trimEnd / audioDuration) * 100 : 0;
    const selectionLeft = Math.min(startPercent, endPercent);
    const selectionWidth = Math.max(0, endPercent - startPercent);
    const selectionRight = selectionLeft + selectionWidth;
    const progressPercent = audioDuration > 0
        ? Math.min(100, Math.max(0, (currentTime / audioDuration) * 100))
        : 0;
    const barCount = waveformPeaks.length;
    const barSlot = barCount > 0 ? 100 / barCount : 0;
    const barFill = barSlot * 0.66;
    const barOffset = (barSlot - barFill) / 2;
    const selectionStartIndex = barCount > 0
        ? Math.min(barCount - 1, Math.floor((selectionLeft / 100) * barCount))
        : 0;
    const selectionEndIndex = barCount > 0
        ? Math.min(barCount - 1, Math.ceil((selectionRight / 100) * barCount))
        : 0;
    const progressIndex = barCount > 0 && audioDuration > 0
        ? Math.min(barCount - 1, Math.floor((currentTime / audioDuration) * barCount))
        : 0;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-black text-white selection:bg-accent-red/30 relative">
            {/* Back Button */}
            <Link
                href="/"
                className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>
            <div className="absolute top-8 right-8">
                <Image
                    src="/presx-logo.png"
                    alt="PresX"
                    width={320}
                    height={96}
                    className="h-24 md:h-32 lg:h-36 w-auto object-contain"
                    priority
                />
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center gap-4 mb-12 text-sm font-medium uppercase tracking-widest text-gray-500">
                <span className={step === 1 ? "text-white" : ""}>01. Details</span>
                <div className="w-8 h-px bg-gray-800" />
                <span className={step === 2 ? "text-white" : ""}>02. Record</span>
            </div>

            {restoredFromDraft && (
                <div className="mb-6 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between gap-4 max-w-md w-full animate-in fade-in duration-500">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Session restored</p>
                    <button
                        onClick={() => { setRestoredFromDraft(false); clearFormDraft(sessionKey); clearRecordingDraft(sessionKey).catch(() => {}); setName(""); setPurpose(""); setAudience(""); setTopic(""); setCurrentAudio(null); setStep(1); setSelectedCriteria([...CRITERIA_KEYS]); setUseCustomCriteria(false); }}
                        className="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        Discard
                    </button>
                </div>
            )}

            {step === 1 ? (
                <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-display font-bold">{isRetry ? "Retry Analysis" : "New Project"}</h1>
                        <p className="text-gray-400">
                            {isRetry
                                ? "Record again under the same project to compare scores."
                                : "Give your session a name to get started."}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Project Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Ethics Academic Poster due 26 March"
                                className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Purpose of Speech</label>
                            <input
                                type="text"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="e.g. Presenting my ethics framework in class"
                                className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Target Audience</label>
                            <input
                                type="text"
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                placeholder="e.g. Students and Tutors"
                                className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Topic (Optional)</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Comparing Utilitarianism and Deontology"
                                className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                            />
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!name.trim() || !purpose.trim() || !audience.trim()}
                            className="w-full mt-8 group flex items-center justify-center gap-2 bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center mb-12 space-y-2">
                        <h2 className="text-2xl font-display font-bold">
                            {name}
                            {isRetry && nextAttemptNumber ? ` — Attempt ${nextAttemptNumber}` : ""}
                        </h2>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <p className="text-gray-400 text-sm uppercase tracking-widest bg-gray-900 px-3 py-1 rounded-full inline-block">
                                {purpose}
                            </p>
                            {topic.trim() && (
                                <p className="text-gray-400 text-sm uppercase tracking-widest bg-gray-900 px-3 py-1 rounded-full inline-block">
                                    Topic: {topic.trim()}
                                </p>
                            )}
                        </div>
                        {isRetry && latestRun && (
                            <div className="text-xs uppercase tracking-widest text-gray-500">
                                Previous score:{" "}
                                <span className="text-white font-bold">{latestRun.analysis.overallScore}/100</span>{" "}
                                <span className="text-gray-600">·</span>{" "}
                                {new Date(latestRun.createdAt).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {!audioBlob ? (
                        <div className="flex flex-col items-center gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AudioRecorder
                                onRecordingComplete={handleRecordingComplete}
                                isProcessing={isProcessing}
                                sessionKey={sessionKey}
                            />

                            <div className="flex items-center gap-4 w-full max-w-xs">
                                <div className="h-px bg-white/10 flex-1" />
                                <span className="text-xs text-gray-500 uppercase tracking-widest">OR</span>
                                <div className="h-px bg-white/10 flex-1" />
                            </div>

                            <label className={`group flex items-center gap-3 px-6 py-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white group-hover:text-accent-red transition-colors">Upload File</p>
                                    <p className="text-xs text-gray-500">Audio or Video (20s - 15m)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="audio/*,video/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isProcessing}
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-bold text-white">Review Recording</h3>
                                    <p className="text-sm text-gray-400">Listen to ensure clear audio quality</p>
                                </div>

                                <audio
                                    ref={audioRef}
                                    src={audioUrl!}
                                    onLoadedMetadata={handleAudioMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                    className="hidden"
                                />

                                {audioDuration > 0 && (
                                    <div className="w-full max-w-xl space-y-4">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-gray-500">
                                            <span>Trim Audio</span>
                                            <span>
                                                {formatTime(trimStart)} - {formatTime(trimEnd)} (
                                                {formatTime(trimEnd - trimStart)})
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div
                                                ref={trimWaveformRef}
                                                className={`relative h-24 w-full cursor-crosshair select-none rounded-xl bg-white/5 border border-white/10 overflow-hidden transition-transform duration-200 ${draggingHandle ? "scale-[1.01]" : ""}`}
                                                onPointerDown={handleWaveformPointerDown}
                                                onPointerMove={handleWaveformPointerMove}
                                                onPointerUp={handleWaveformPointerUp}
                                                onPointerCancel={handleWaveformPointerUp}
                                                role="presentation"
                                            >
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {barCount > 0 ? (
                                                        waveformPeaks.map((peak, index) => {
                                                            const height = Math.max(6, Math.round(peak * 60));
                                                            const isInSelection = index >= selectionStartIndex && index <= selectionEndIndex;
                                                            const isPlayed = index <= progressIndex;
                                                            const color = isInSelection
                                                                ? (isPlayed ? "bg-accent-red" : "bg-white")
                                                                : "bg-white/25";
                                                            return (
                                                                <span
                                                                    key={`trim-${index}`}
                                                                    className={`absolute top-1/2 -translate-y-1/2 rounded-full transition-colors duration-150 ${color}`}
                                                                    style={{
                                                                        left: `${index * barSlot + barOffset}%`,
                                                                        width: `${barFill}%`,
                                                                        height,
                                                                    }}
                                                                />
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="w-full h-1 rounded-full bg-white/10" />
                                                    )}
                                                </div>
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-black/70 pointer-events-none"
                                                    style={{ width: `${selectionLeft}%` }}
                                                />
                                                <div
                                                    className="absolute inset-y-0 right-0 bg-black/70 pointer-events-none"
                                                    style={{ width: `${Math.max(0, 100 - selectionRight)}%` }}
                                                />
                                                <div
                                                    className="absolute inset-y-0 rounded-lg border-[3px] border-accent-red bg-accent-red/12 box-border cursor-grab z-10"
                                                    style={{ left: `${selectionLeft}%`, width: `${selectionWidth}%` }}
                                                    onPointerDown={handleRangePointerDown}
                                                />
                                                <div
                                                    className="absolute inset-y-[3px] w-[28px] flex items-center justify-center cursor-ew-resize z-30 rounded-md bg-white/10"
                                                    style={{ left: `calc(${selectionLeft}% + 3px)` }}
                                                    onPointerDown={handleStartHandlePointerDown}
                                                >
                                                    <div className="flex flex-col gap-[4px]">
                                                        <span className="w-[3px] h-[3px] rounded-full bg-white/80" />
                                                        <span className="w-[3px] h-[3px] rounded-full bg-white/80" />
                                                        <span className="w-[3px] h-[3px] rounded-full bg-white/80" />
                                                    </div>
                                                </div>
                                                <div
                                                    className="absolute inset-y-[3px] w-[28px] -translate-x-full flex items-center justify-center cursor-ew-resize z-30 rounded-md bg-white/10"
                                                    style={{ left: `calc(${selectionRight}% - 3px)` }}
                                                    onPointerDown={handleEndHandlePointerDown}
                                                >
                                                    <div className="flex flex-col gap-[4px]">
                                                        <span className="w-[3px] h-[3px] rounded-full bg-white/80" />
                                                        <span className="w-[3px] h-[3px] rounded-full bg-white/80" />
                                                        <span className="w-[3px] h-[3px] rounded-full bg-white/80" />
                                                    </div>
                                                </div>
                                                {draggingHandle === "start" && (
                                                    <div
                                                        className="absolute -top-6 -translate-x-1/2 px-2 py-1 rounded-full bg-black/80 text-white text-[10px] uppercase tracking-widest pointer-events-none z-40"
                                                        style={{ left: `${selectionLeft}%` }}
                                                    >
                                                        {formatTime(trimStart)}
                                                    </div>
                                                )}
                                                {draggingHandle === "end" && (
                                                    <div
                                                        className="absolute -top-6 -translate-x-1/2 px-2 py-1 rounded-full bg-black/80 text-white text-[10px] uppercase tracking-widest pointer-events-none z-40"
                                                        style={{ left: `${selectionRight}%` }}
                                                    >
                                                        {formatTime(trimEnd)}
                                                    </div>
                                                )}
                                                <div
                                                    className="absolute inset-y-0 z-40"
                                                    style={{ left: `${progressPercent}%` }}
                                                >
                                                    <div
                                                        className="absolute -left-3 top-0 h-full w-6 cursor-ew-resize"
                                                        onPointerDown={handlePlayheadPointerDown}
                                                    >
                                                        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/60" />
                                                        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent-red shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500">
                                                <span>0:00</span>
                                                <span>{formatTime(audioDuration)}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-4 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleTogglePlayback}
                                                    className="w-12 h-12 rounded-full border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                                                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                                                >
                                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                                </button>
                                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest tabular-nums">
                                                    {formatTime(currentTime)} / {formatTime(audioDuration)}
                                                </div>
                                            </div>
                                            <p className="text-[10px] uppercase tracking-widest text-gray-500 text-center">
                                                Select the part you want analyzed.
                                            </p>
                                        </div>

                                        {!selectionValid && (
                                            <p className="text-xs text-red-400">
                                                Selection must be between {MIN_DURATION}s and {MAX_DURATION / 60}m.
                                            </p>
                                        )}
                                        {trimError && (
                                            <p className="text-xs text-red-400">{trimError}</p>
                                        )}
                                    </div>
                                )}

                                {/* Usage indicator */}
                                <div className="w-full max-w-md pt-2">
                                    {subscription?.plan === "free" ? (
                                        <div className="border border-red-400/30 bg-red-400/5 rounded-lg px-4 py-3 flex items-center justify-between">
                                            <p className="text-xs text-red-400">
                                                Your free trial has ended.
                                            </p>
                                            <Link href="/checkout" className="bg-accent-red hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                                                Upgrade
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                <span className="uppercase tracking-widest">Analyses today</span>
                                                <span className="text-white font-bold">
                                                    {dailyLimit > 100 ? `${dailyUsed} used` : `${dailyRemaining}/${dailyLimit} remaining`}
                                                </span>
                                            </div>
                                            {dailyLimit > 100 ? (
                                                <div className="text-xs text-gray-400">
                                                    {dailyUsed} used today <span className="text-green-400">(unlimited)</span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    {Array.from({ length: dailyLimit }, (_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`h-1.5 flex-1 rounded-full ${i < dailyUsed ? "bg-white/30" : "bg-white"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            {!subCanAnalyze && dailyUsed >= dailyLimit && (
                                                <p className="text-xs text-purple-500 mt-2">
                                                    Daily limit reached. Resets tomorrow.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                                    <button
                                        onClick={handleRetake}
                                        disabled={isBusy}
                                        className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Retake
                                    </button>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isBusy || !canAnalyze}
                                        className="flex-1 flex items-center justify-center gap-2 bg-accent-red text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-purple-700 transition-colors disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        {isProcessing
                                            ? (analysisStatus === "trimming" ? "Preparing..."
                                                : analysisStatus === "uploading" ? "Uploading..."
                                                : analysisStatus === "submitting" ? "Submitting..."
                                                : analysisStatus === "processing" ? "Analyzing..."
                                                : "Processing...")
                                            : "Analyze"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="w-full mt-10 flex flex-col items-center gap-6">
                        <div className="w-full max-w-md">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Custom Feedback (Optional)</p>
                                    <p className="text-sm text-gray-400">Pick the areas you want assessed.</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={useCustomCriteria}
                                    onClick={toggleCustomCriteria}
                                    disabled={criteriaSelectionDisabled}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useCustomCriteria ? "bg-accent-red" : "bg-gray-700"
                                        } ${criteriaSelectionDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCustomCriteria ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                            {!useCustomCriteria && (
                                <p className="text-xs text-gray-500 mt-2">Default: all areas are assessed.</p>
                            )}
                        </div>

                        {useCustomCriteria && (
                            <div className="w-full">
                                <div className={`w-full bg-white/5 border border-white/10 rounded-2xl p-6 ${criteriaSelectionDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold">Areas to Assess</h3>
                                            <p className="text-sm text-gray-400">Toggle the categories you want feedback on.</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
                                            <button
                                                type="button"
                                                onClick={selectAllCriteria}
                                                className="hover:text-white transition-colors"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-gray-700">|</span>
                                            <button
                                                type="button"
                                                onClick={clearAllCriteria}
                                                className="hover:text-white transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {CRITERIA.map((item) => {
                                            const checked = selectedCriteria.includes(item.key);
                                            return (
                                                <label
                                                    key={item.key}
                                                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${checked
                                                        ? "border-white/40 bg-white/5"
                                                        : "border-white/10 hover:border-white/20"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 h-4 w-4 accent-accent-red"
                                                        checked={checked}
                                                        onChange={() => toggleCriterion(item.key)}
                                                        disabled={criteriaSelectionDisabled}
                                                    />
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-white">{item.label}</p>
                                                        <p className="text-xs text-gray-500">{item.description}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {useCustomCriteria && !hasCriteria && (
                                        <p className="text-xs text-red-400 mt-4">
                                            Select at least one criterion to analyze.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </main>
    );
}
