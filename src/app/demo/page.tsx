"use client";

import React from "react";
import { ShareableCard } from "@/components/share/ShareableCard";

import { Project } from "@/types/project";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Hardcoded static project data for demo purpose
const STATIC_PROJECT: Project = {
    id: "demo-static-123",
    name: "The Future of AI",
    purpose: "Inspire the audience",
    audience: "Colleagues",
    createdAt: new Date().toISOString(),
    analysis: {
        overallScore: 94,
        subscores: {
            fluency: 92,
            pacing: 88,
            clarity: 85,
            engagement: 90,
            vocabularyEffectiveness: 85,
            structureAndFlow: 89
        },
        metrics: {
            estimatedWPM: 142,
            fillerWordCount: 1,
            fillerWordsPerMinute: 0.5,
            longPauses: 1,
            averagePauseSeconds: 0.5,
            silenceRatio: 0.05,
            unclearSegments: 0
        },
        // Detailed fields are optional/empty for card view
        criterionFeedback: {},
        evidenceMoments: [],
        overallImprovementPlan: {
            topPriorities: [],
            practiceDrills: [],
            nextRecordingGoal: ""
        },
        finalMorale: "Excellent work!",
        privacyNote: ""
    }
};

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4 font-sans">
            <nav className="w-full max-w-5xl flex justify-between items-center mb-12">
                <Link href="/" className="relative h-12 w-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/presx-logo.png"
                        alt="PresX"
                        className="h-full w-auto object-contain"
                    />
                </Link>
                <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-[#5e17eb]">
                    Static Demo Mode
                </div>
            </nav>

            <main className="flex flex-col items-center w-full max-w-4xl">
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black mb-2 text-white font-display uppercase tracking-tight">
                        Your Scorecard
                    </h1>
                    <p className="text-gray-400 text-lg font-sans">
                        This is a static preview of the shareable result card.
                    </p>
                </div>

                <div className="w-full flex justify-center">
                    <ShareableCard project={STATIC_PROJECT} />
                </div>
                <div className="mt-12 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
