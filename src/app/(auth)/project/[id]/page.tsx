"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Clock, Tag, ArrowLeftRight, Play, Pause, Loader2, Volume2, Trash2, Share2, X } from "lucide-react";
import Image from "next/image";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import { ShareableCard } from "@/components/share/ShareableCard";
import { AnimatePresence, motion } from "framer-motion";
import { getProject, getAudioPlaybackUrl, deleteProject } from "@/lib/api";
import { clearFormDraft, clearRecordingDraft } from "@/lib/sessionDraft";
import { Project } from "@/types/project";
import Link from "next/link";
import { CRITERIA, CRITERIA_KEYS } from "@/lib/criteria";

export default function ProjectResultPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [compareAId, setCompareAId] = useState<string | null>(null);
    const [compareBId, setCompareBId] = useState<string | null>(null);
    const [detailAttemptId, setDetailAttemptId] = useState<string | null>(null);
    const [playingRunId, setPlayingRunId] = useState<string | null>(null);
    const [loadingRunId, setLoadingRunId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [pausedRunId, setPausedRunId] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setPlayingRunId(null);
        setPausedRunId(null);
    }, []);

    const handlePlayToggle = useCallback(async (runId: string, s3Key: string) => {
        // If same run is playing, pause it (keep source intact for resume)
        if (playingRunId === runId) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setPlayingRunId(null);
            setPausedRunId(runId);
            return;
        }

        // If resuming a paused run, just call play()
        if (pausedRunId === runId && audioRef.current && audioRef.current.src) {
            try {
                await audioRef.current.play();
                setPlayingRunId(runId);
                setPausedRunId(null);
                return;
            } catch {
                // Source may have been invalidated — fall through to fetch a new URL
            }
        }

        // Stop any currently playing/paused audio
        stopAudio();
        setLoadingRunId(runId);

        try {
            const { url } = await getAudioPlaybackUrl(s3Key);
            if (!audioRef.current) {
                audioRef.current = new Audio();
            }
            const audio = audioRef.current;
            audio.src = url;
            audio.onended = () => {
                setPlayingRunId(null);
                setPausedRunId(null);
            };
            audio.onerror = () => {
                setPlayingRunId(null);
                setPausedRunId(null);
            };
            await audio.play();
            setPlayingRunId(runId);
        } catch {
            // silently ignore playback errors
        } finally {
            setLoadingRunId(null);
        }
    }, [playingRunId, pausedRunId, stopAudio]);

    const handleDelete = useCallback(async () => {
        const projectId = typeof params.id === "string" ? params.id : "";
        if (!projectId) return;
        setDeleting(true);
        try {
            stopAudio();
            await deleteProject(projectId);
            // Clear browser-stored drafts (localStorage + IndexedDB)
            clearFormDraft(projectId);
            await clearRecordingDraft(projectId).catch(() => { });
            router.push("/");
        } catch {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    }, [params.id, router, stopAudio]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    useEffect(() => {
        if (params.id && typeof params.id === "string") {
            getProject(params.id)
                .then((found) => {
                    if (found) {
                        setProject(found);
                    } else {
                        router.push("/");
                    }
                })
                .catch(() => router.push("/"))
                .finally(() => setLoading(false));
        }
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!project) return null;

    const baseHistory = Array.isArray(project.analysisHistory) ? project.analysisHistory : [];
    const analysisHistory = baseHistory.length === 0 && project.analysis
        ? [{ id: `legacy-${project.id}`, createdAt: project.createdAt, analysis: project.analysis }]
        : baseHistory;
    const sortedHistory = [...analysisHistory].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const latestRun = sortedHistory[sortedHistory.length - 1];
    const previousRun = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;
    const scoreDelta = latestRun && previousRun
        ? latestRun.analysis.overallScore - previousRun.analysis.overallScore
        : null;
    const attemptMap = new Map(sortedHistory.map((run, index) => [run.id, index + 1]));
    const fallbackAId = latestRun?.id ?? null;
    const fallbackBId = previousRun?.id ?? (sortedHistory[0]?.id ?? null);
    const selectedAId = compareAId ?? fallbackAId;
    const selectedBId = compareBId ?? fallbackBId;
    const selectedA = selectedAId
        ? sortedHistory.find((run) => run.id === selectedAId) ?? latestRun
        : null;
    const selectedB = selectedBId
        ? sortedHistory.find((run) => run.id === selectedBId) ?? previousRun ?? latestRun
        : null;
    const selectedDetailId = detailAttemptId ?? selectedA?.id ?? latestRun?.id ?? null;
    const selectedDetailRun = selectedDetailId
        ? sortedHistory.find((run) => run.id === selectedDetailId) ?? latestRun
        : latestRun;
    const detailAnalysis = selectedDetailRun?.analysis ?? project.analysis;
    const comparisonDelta = selectedA && selectedB
        ? selectedA.analysis.overallScore - selectedB.analysis.overallScore
        : null;
    const criteriaToCompare = CRITERIA_KEYS.filter((key) => {
        const aScore = selectedA?.analysis.subscores?.[key];
        const bScore = selectedB?.analysis.subscores?.[key];
        return typeof aScore === "number" || typeof bScore === "number";
    });

    return (
        <main className="min-h-screen bg-black text-white p-8 md:p-24">
            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-display font-bold text-white">Delete Project</h2>
                            <p className="text-sm text-gray-400">
                                Are you sure you want to delete <span className="text-white font-semibold">{project.name}</span>? This will permanently remove all analysis results, audio recordings, and saved drafts.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="px-5 py-2.5 rounded-lg border border-white/20 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold uppercase tracking-widest text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <Image
                            src="/presx-logo.png"
                            alt="PresX"
                            width={320}
                            height={96}
                            className="h-24 md:h-32 lg:h-36 w-auto object-contain"
                            priority
                        />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-display font-bold">{project.name}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    <span>{project.purpose || (project as any).context}</span>
                                </div>
                                {project.audience && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                                        <span>{project.audience}</span>
                                    </div>
                                )}
                                {project.topic && project.topic.trim() && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                                        <span>Topic: {project.topic}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 text-xs font-bold uppercase tracking-widest text-purple-400 hover:bg-purple-500/10 transition-colors"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                Share
                            </button>
                            <Link
                                href={`/new?projectId=${project.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
                            >
                                Retry Analysis
                            </Link>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {sortedHistory.length > 0 && (
                    <div className="p-6 md:p-8 border border-white/10 rounded-2xl bg-white/5 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Score History</h3>
                            {scoreDelta !== null && (
                                <span
                                    className={`text-sm font-bold uppercase tracking-widest ${scoreDelta >= 0 ? "text-green-400" : "text-red-400"
                                        }`}
                                >
                                    {scoreDelta >= 0 ? "+" : ""}
                                    {scoreDelta} vs last attempt
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...sortedHistory].reverse().map((run, index) => (
                                <div
                                    key={run.id || `run-${index}`}
                                    className="p-4 border border-white/10 rounded-xl bg-black/40"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs uppercase tracking-widest text-gray-500">
                                            Attempt {sortedHistory.length - index}
                                        </div>
                                        {run.s3Key && (
                                            <button
                                                onClick={() => handlePlayToggle(run.id, run.s3Key!)}
                                                disabled={loadingRunId === run.id}
                                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
                                                aria-label={playingRunId === run.id ? "Pause audio" : "Play audio"}
                                            >
                                                {loadingRunId === run.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                                ) : playingRunId === run.id ? (
                                                    <Pause className="w-3.5 h-3.5 text-accent-red" />
                                                ) : pausedRunId === run.id ? (
                                                    <Play className="w-3.5 h-3.5 text-accent-red ml-0.5" />
                                                ) : (
                                                    <Play className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-2xl font-display font-bold text-white mt-2">
                                        {run.analysis.overallScore}/100
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {new Date(run.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {sortedHistory.length > 1 && selectedA && selectedB && (
                    <div className="p-6 md:p-8 border border-white/10 rounded-2xl bg-white/5 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-accent-red">
                                    <ArrowLeftRight className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                        Compare Attempts
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Select any two attempts to see deltas.
                                    </p>
                                </div>
                            </div>
                            {comparisonDelta !== null && (
                                <span
                                    className={`text-sm font-bold uppercase tracking-widest ${comparisonDelta >= 0 ? "text-green-400" : "text-red-400"
                                        }`}
                                >
                                    {comparisonDelta >= 0 ? "+" : ""}
                                    {comparisonDelta} (A - B overall)
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                    Attempt A
                                </label>
                                <select
                                    value={selectedAId ?? ""}
                                    onChange={(e) => setCompareAId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                >
                                    {sortedHistory.map((run) => (
                                        <option key={run.id} value={run.id}>
                                            Attempt {attemptMap.get(run.id)} · {run.analysis.overallScore}/100 ·{" "}
                                            {new Date(run.createdAt).toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                    Attempt B
                                </label>
                                <select
                                    value={selectedBId ?? ""}
                                    onChange={(e) => setCompareBId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                >
                                    {sortedHistory.map((run) => (
                                        <option key={run.id} value={run.id}>
                                            Attempt {attemptMap.get(run.id)} · {run.analysis.overallScore}/100 ·{" "}
                                            {new Date(run.createdAt).toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                                <div className="text-xs uppercase tracking-widest text-gray-500">
                                    Attempt {attemptMap.get(selectedA.id)}
                                </div>
                                <div className="text-3xl font-display font-bold text-white mt-2">
                                    {selectedA.analysis.overallScore}/100
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                    {new Date(selectedA.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                                <div className="text-xs uppercase tracking-widest text-gray-500">
                                    Attempt {attemptMap.get(selectedB.id)}
                                </div>
                                <div className="text-3xl font-display font-bold text-white mt-2">
                                    {selectedB.analysis.overallScore}/100
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                    {new Date(selectedB.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
                                <div className="text-xs uppercase tracking-widest text-gray-500">Delta</div>
                                <div
                                    className={`text-3xl font-display font-bold ${comparisonDelta !== null && comparisonDelta >= 0 ? "text-green-400" : "text-red-400"
                                        }`}
                                >
                                    {comparisonDelta !== null ? `${comparisonDelta >= 0 ? "+" : ""}${comparisonDelta}` : "—"}
                                </div>
                                <div className="text-xs text-gray-500">A minus B overall score</div>
                            </div>
                        </div>

                        {criteriaToCompare.length > 0 && (
                            <div className="border border-white/10 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-4 gap-0 text-xs uppercase tracking-widest text-gray-500 bg-black/40 px-4 py-3">
                                    <span>Criterion</span>
                                    <span>Attempt A</span>
                                    <span>Attempt B</span>
                                    <span>Delta (A - B)</span>
                                </div>
                                <div className="divide-y divide-white/10">
                                    {criteriaToCompare.map((key) => {
                                        const label = CRITERIA.find((item) => item.key === key)?.label || key;
                                        const aScore = selectedA.analysis.subscores?.[key];
                                        const bScore = selectedB.analysis.subscores?.[key];
                                        const delta = typeof aScore === "number" && typeof bScore === "number"
                                            ? aScore - bScore
                                            : null;
                                        return (
                                            <div key={key} className="grid grid-cols-4 gap-0 px-4 py-3 text-sm">
                                                <span className="text-white">{label}</span>
                                                <span className="text-gray-300">{typeof aScore === "number" ? `${aScore}/100` : "—"}</span>
                                                <span className="text-gray-300">{typeof bScore === "number" ? `${bScore}/100` : "—"}</span>
                                                <span className={delta === null ? "text-gray-500" : (delta >= 0 ? "text-green-400" : "text-red-400")}>
                                                    {delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {sortedHistory.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                Detailed Analysis
                            </h3>
                            <p className="text-xs text-gray-500">Choose which attempt’s full feedback to view.</p>
                        </div>
                        <div className="min-w-[220px]">
                            <select
                                value={selectedDetailId ?? ""}
                                onChange={(e) => setDetailAttemptId(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                            >
                                {sortedHistory.map((run) => (
                                    <option key={run.id} value={run.id}>
                                        Attempt {attemptMap.get(run.id)} · {run.analysis.overallScore}/100 ·{" "}
                                        {new Date(run.createdAt).toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Results */}
                <FeedbackDisplay data={detailAnalysis ?? null} />
            </div>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-display font-bold text-white">Share Your Results</h2>
                                    <p className="text-gray-400">Download your stats card and challenge your friends.</p>
                                </div>

                                <ShareableCard project={project} shareUrl={`${window.location.origin}/share/${project.id}?u=${user?.id}`} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
