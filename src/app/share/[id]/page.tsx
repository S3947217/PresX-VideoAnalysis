import React from "react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { ShareableCard } from "@/components/share/ShareableCard";
import Image from "next/image";
import Link from "next/link";
import { Project } from "@/types/project";
import { ArrowRight } from "lucide-react";

interface SharePageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ u?: string }>;
}

async function getProject(id: string, userId: string): Promise<Project | null> {
    const baseUrl = process.env.API_GATEWAY_URL;
    if (!baseUrl) return null;

    const url = `${baseUrl}/public/projects?userId=${userId}&projectId=${id}`;

    try {
        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params, searchParams }: SharePageProps): Promise<Metadata> {
    const { id } = await params;
    const { u } = await searchParams;

    if (!u) return { title: "PresX Share" };

    const project = await getProject(id, u);
    const a = project?.analysis;
    const score = a?.overallScore || 0;

    const headersList = await headers();
    const host = headersList.get("host") || "presx.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const ogParams = new URLSearchParams({
        t: project?.topic || project?.name || "Presentation",
        s: String(score),
        f: String(a?.subscores?.fluency ?? 0),
        p: String(a?.subscores?.pacing ?? 0),
        c: String(a?.subscores?.clarity ?? 0),
        st: String(a?.subscores?.structureAndFlow ?? 0),
        e: String(a?.subscores?.engagement ?? 0),
        v: String(a?.subscores?.vocabularyEffectiveness ?? 0),
        wpm: String(a?.metrics?.estimatedWPM ?? 0),
        fl: String(a?.metrics?.fillerWordCount ?? 0),
    });
    const ogImage = `${baseUrl}/api/og/${id}?${ogParams.toString()}`;

    return {
        title: `I scored ${score}/100 on PresX! 🎤`,
        description: "Detailed feedback on pace, fillers, and more.",
        openGraph: {
            title: `I scored ${score}/100 on PresX! 🎤`,
            description: "Check out my detailed presentation analysis.",
            images: [ogImage],
        },
        twitter: {
            card: "summary_large_image",
            title: `I scored ${score}/100 on PresX! 🎤`,
            description: "Check out my detailed presentation analysis.",
            images: [ogImage],
        },
    };
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
    const { id } = await params;
    const { u } = await searchParams;

    if (!u) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                <h1 className="text-2xl font-bold mb-4 font-display">Invalid Link</h1>
                <p className="text-gray-400">This share link is missing information.</p>
                <Link href="/login" className="text-accent-red hover:underline font-bold mt-4">
                    Go Home
                </Link>
            </div>
        );
    }

    const project = await getProject(id, u);

    if (!project || !project.analysis) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                <h1 className="text-2xl font-bold mb-4 font-display">Project not found</h1>
                <p className="text-gray-400">This project may be private or no longer available.</p>
                <Link href="/login" className="text-accent-red hover:underline font-bold mt-4">
                    Go Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4 font-sans">
            <nav className="w-full max-w-5xl flex justify-between items-center mb-12">
                <Link href="/login">
                    <Image
                        src="/presx-logo.png"
                        alt="PresX"
                        width={160}
                        height={48}
                        className="h-12 w-auto object-contain"
                    />
                </Link>
                <Link
                    href="/login#signin"
                    className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-colors font-bold tracking-wide text-sm"
                >
                    Sign in
                </Link>
            </nav>

            <main className="flex flex-col items-center w-full max-w-2xl">
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black mb-2 text-white font-display uppercase tracking-tight">
                        Analysis Results
                    </h1>
                    <p className="text-gray-400 text-lg font-sans">
                        See how <span className="text-white font-bold">{project.name || "this presentation"}</span> performed.
                    </p>
                </div>

                <div className="w-full">
                    <ShareableCard project={project} />
                </div>

                <div className="flex flex-col items-center gap-8 mt-12 max-w-md text-center">
                    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 w-full backdrop-blur-sm">
                        <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 font-display">
                            Create your own <ArrowRight className="w-5 h-5 text-accent-red" />
                        </h3>
                        <p className="text-sm text-gray-400">
                            Detailed analysis like this in seconds.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold font-display leading-tight">
                            Want to improve your own <br />
                            <span className="text-accent-red">speaking skills?</span>
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Upload your audio and get instant expert feedback on fluency, confidence, and more.
                        </p>
                        <Link
                            href="/signup"
                            className="inline-flex items-center gap-2 bg-accent-red hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-accent-red/25 transition-all transform hover:-translate-y-1 w-full justify-center"
                        >
                            Try it free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="mt-20 text-gray-500 text-sm font-sans">
                &copy; {new Date().getFullYear()} PresX. All rights reserved.
            </footer>
        </div>
    );
}
