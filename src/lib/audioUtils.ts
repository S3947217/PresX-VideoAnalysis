export const MIN_DURATION = 20; // 20 seconds
export const MAX_DURATION = 900; // 15 minutes

// Helper to validate and process an uploaded file (Audio or Video) to WAV Blob
export const processMediaFile = async (file: File): Promise<Blob> => {
    // 1. Basic type check (though input accept handles most)
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        throw new Error("Invalid file type. Please upload an audio or video file.");
    }

    // 2. Client-side Audio Processing
    // We use a temporary AudioContext to decode the file data.
    // This works for both audio and video files (browser decodes the audio track).
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const duration = audioBuffer.duration;

        // 3. Duration Validation
        if (duration < MIN_DURATION) {
            throw new Error(`Recording is too short (${Math.round(duration)}s). Minimum duration is ${MIN_DURATION} seconds.`);
        }
        if (duration > MAX_DURATION) {
            throw new Error(`Recording is too long (${Math.round(duration / 60)}m). Maximum duration is ${MAX_DURATION / 60} minutes.`);
        }

        // 4. Convert to WAV
        // We need to get the channel data and encode it.
        // We'll take the first channel (mono) or mix down if needed, but for simplicity, let's just take channel 0.
        // If we want to be robust, we can support multi-channel, but our API likely expects mono/stereo WAV.

        // Let's use the exportWAV helper. We need to convert the AudioBuffer to Float32Array[].
        const numberOfChannels = audioBuffer.numberOfChannels;
        const channelData: Float32Array[] = [];

        // We'll just grab the first channel for now to keep it simple and consistent with the mic recording
        // (which was mono in the previous implementation logic, though scriptProcessor was configurable).
        // Actually, let's keep it mono for consistency with the analysis API.
        const chan0 = audioBuffer.getChannelData(0);
        channelData.push(chan0); // exportWAV expects an array of buffers (chunks), here we have one big chunk

        return exportWAV(channelData, audioBuffer.sampleRate);

    } finally {
        // Clean up
        audioContext.close();
    }
};

// --- WAV Encoding Helpers (Extracted from AudioRecorder) ---

export const TARGET_SAMPLE_RATE = 16000; // 16kHz — sufficient for speech, ~63% smaller than 44.1kHz

export const downsample = (samples: Float32Array, fromRate: number, toRate: number): Float32Array => {
    if (fromRate === toRate) return samples;
    const ratio = fromRate / toRate;
    const newLength = Math.round(samples.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const prev = Math.floor(srcIndex);
        const next = Math.min(prev + 1, samples.length - 1);
        const frac = srcIndex - prev;
        result[i] = samples[prev] * (1 - frac) + samples[next] * frac;
    }
    return result;
};

export const exportWAV = (buffers: Float32Array[], sampleRate: number) => {
    const merged = mergeBuffers(buffers);
    const resampled = downsample(merged, sampleRate, TARGET_SAMPLE_RATE);
    const dataview = encodeWAV(resampled, TARGET_SAMPLE_RATE);
    return new Blob([dataview], { type: "audio/wav" });
};

export const trimAudioBlob = async (
    blob: Blob,
    startSeconds: number,
    endSeconds: number
): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const duration = audioBuffer.duration;
        const start = Math.max(0, Math.min(startSeconds, duration));
        const end = Math.max(start, Math.min(endSeconds, duration));

        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(start * sampleRate);
        const endSample = Math.floor(end * sampleRate);

        const source = audioBuffer.getChannelData(0);
        const segmentView = source.subarray(startSample, endSample);
        const segment = new Float32Array(segmentView);

        return exportWAV([segment], sampleRate);
    } finally {
        audioContext.close();
    }
};

const mergeBuffers = (buffers: Float32Array[]) => {
    let resultLength = 0;
    for (const b of buffers) resultLength += b.length;
    const result = new Float32Array(resultLength);
    let offset = 0;
    for (const b of buffers) {
        result.set(b, offset);
        offset += b.length;
    }
    return result;
};

const encodeWAV = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true); // Mono
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
};
