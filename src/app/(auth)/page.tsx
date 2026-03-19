"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mic, LogOut, Trophy, ChevronDown, ChevronUp, HelpCircle, Trash2, Loader2 } from "lucide-react";
import { getProjects, deleteProject } from "@/lib/api";
import { clearFormDraft, clearRecordingDraft } from "@/lib/sessionDraft";
import { Project } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import SubscriptionBanner from "@/components/SubscriptionBanner";

export default function DashboardPage() {
    const { user, signOut } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [mounted, setMounted] = useState(false);
    const [exampleOpen, setExampleOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        getProjects()
            .then(setProjects)
            .catch((err) => console.error("Failed to load projects", err))
            .finally(() => setMounted(true));
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteProject(deleteTarget.id);
            clearFormDraft(deleteTarget.id);
            await clearRecordingDraft(deleteTarget.id).catch(() => {});
            setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch {
            // keep dialog open on error
        } finally {
            setDeleting(false);
        }
    };

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 selection:bg-accent-red/30">
            {/* Delete confirmation dialog */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                            <h2 className="text-xl font-display font-bold text-white">Delete Project</h2>
                            <p className="text-sm text-gray-400">
                                Are you sure you want to delete <span className="text-white font-semibold">{deleteTarget.name}</span>? This will permanently remove all analysis results, audio recordings, and saved drafts.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setDeleteTarget(null)}
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

            {/* Navbar */}
            <nav className="max-w-7xl mx-auto mb-12 lg:mb-24 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Image
                        src="/presx-logo.png"
                        alt="PresX"
                        width={320}
                        height={96}
                        className="h-24 md:h-32 lg:h-36 w-auto object-contain"
                        priority
                    />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-8">
                    <span className="text-sm font-medium text-gray-300">
                        Dashboard
                    </span>
                    <button
                        onClick={signOut}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                    <Link
                        href="/new"
                        className="bg-accent-red hover:bg-purple-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95"
                    >
                        New Project
                    </Link>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

                {/* Left Column: Pitch & Greeting */}
                <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24 lg:h-fit">
                    <SubscriptionBanner />
                    <div className="space-y-6">
                        <p className="text-lg text-white font-medium">
                            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
                        </p>

                        <div className="space-y-4">
                            <h2 className="text-5xl md:text-7xl font-display font-bold leading-[0.9] tracking-tighter">
                                Your <br />
                                <span className="text-white">Presentation</span> <br />
                                <span className="text-gray-500">
                                    expert.
                                </span>
                            </h2>
                            <p className="text-lg text-gray-400 leading-relaxed max-w-sm pt-4">
                                Expert feedback on fluency, pacing, and filler words. Elevate your communication skills with real-time analysis.
                            </p>
                        </div>
                    </div>

                    {/* How Scoring Works link */}
                    <Link
                        href="/guide"
                        className="flex items-center gap-3 p-5 border border-white/10 bg-white/[0.03] rounded-2xl hover:bg-white/[0.06] hover:border-white/20 transition-all group"
                    >
                        <HelpCircle className="w-5 h-5 text-accent-red" />
                        <div className="flex-1">
                            <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                How scoring works
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Learn what makes a great score</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>

                {/* Right Column: Projects & Actions */}
                <div className="lg:col-span-7 space-y-8">
                    {/* 100/100 Example */}
                    <div className="border border-accent-red/30 bg-accent-red/5 rounded-2xl overflow-hidden">
                        <button
                            onClick={() => setExampleOpen(!exampleOpen)}
                            className="w-full p-6 flex items-center justify-between hover:bg-accent-red/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-accent-red" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-display font-bold">This is what an excellent presentation looks like</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        Watch a world-class TED Talk and see the standard to aim for.
                                    </p>
                                </div>
                            </div>
                            {exampleOpen ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>

                        {exampleOpen && (
                            <div className="px-6 pb-6 space-y-4">
                                <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                                    <iframe
                                        src="https://www.youtube.com/embed/bsxJVgb6Kls"
                                        title="TED Talk Example — What 100/100 looks like"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    This TED Talk demonstrates perfect scores across all six dimensions — fluency, pacing, clarity, structure, engagement, and vocabulary. Use it as a benchmark for your own presentations.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-xl font-display font-bold text-gray-300">Recent Projects</h3>
                    </div>

                    {projects.length > 0 ? (
                        <div className="grid gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="group relative border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                                >
                                    <Link
                                        href={`/project/${project.id}`}
                                        className="block p-6"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-xl font-bold group-hover:text-white/90 transition-colors">{project.name}</h2>
                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-white/20 text-gray-400 rounded-full">
                                                        {project.analysis?.overallScore ? `${project.analysis.overallScore}/100` : "N/A"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 uppercase tracking-widest font-medium">
                                                    <span>{project.purpose}</span>
                                                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-7">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setDeleteTarget(project);
                                                    }}
                                                    className="w-11 h-11 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                                    aria-label={`Delete ${project.name}`}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-lg text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Mic className="w-8 h-8 text-gray-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">No projects yet</h3>
                                <p className="text-gray-400 max-w-sm mx-auto">Start your free recording session to get expert feedback on your speaking skills.</p>
                            </div>
                            <Link
                                href="/new"
                                className="text-accent-red font-bold uppercase tracking-widest text-sm hover:text-white transition-colors"
                            >
                                Start Recording &rarr;
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
