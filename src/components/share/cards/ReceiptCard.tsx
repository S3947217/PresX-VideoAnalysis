import React from "react";
import { Project } from "@/types/project";

interface ReceiptCardProps {
    project: Project;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ project }) => {
    const analysis = project.analysis;
    if (!analysis) return null;

    return (
        <div className="relative w-full h-[600px] bg-[#f0f0f0] p-6 text-black font-mono flex flex-col shadow-2xl overflow-hidden">
            {/* Zigzag Top */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-[linear-gradient(135deg,#f0f0f0_50%,transparent_50%),linear-gradient(-135deg,#f0f0f0_50%,transparent_50%)] bg-[length:20px_20px]" />

            <div className="mt-4 text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-1">PresX Report</h2>
                <p className="text-xs text-gray-500 uppercase">
                    Order #{project.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 uppercase">
                    {new Date(project.createdAt).toLocaleString()}
                </p>
            </div>

            <div className="flex-1 space-y-3 text-sm">

                <div className="flex justify-between items-center text-xl font-bold mt-2">
                    <span className="uppercase">TOTAL SCORE</span>
                    <span>{analysis.overallScore}</span>
                </div>
                <div className="text-center text-xs text-gray-400 uppercase mt-1 mb-4">
                    (Top {analysis.overallScore >= 80 ? "1%" : analysis.overallScore >= 60 ? "40%" : "50%"} of Users)
                </div>

                <div className="my-4 border-b border-gray-300" />

                <div className="flex justify-between items-center">
                    <span className="uppercase">Fluency Score</span>
                    <span>{analysis.subscores.fluency}/100</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="uppercase">Engagement Lvl</span>
                    <span>{analysis.subscores.engagement}/100</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="uppercase">Pacing (WPM)</span>
                    <span>{analysis.metrics.estimatedWPM}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                    <span className="uppercase">Filler Words</span>
                    <span>x{analysis.metrics.fillerWordCount}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="uppercase">Clarity</span>
                    <span>{analysis.subscores.clarity}/100</span>
                </div>

                <div className="my-4 border-b-2 border-dashed border-gray-300" />
            </div>

            <div className="mt-auto text-center space-y-4">
                <div className="border-2 border-black p-2 inline-block -rotate-2">
                    <p className="text-[10px] font-bold uppercase">
                        VERIFIED BY PRESX
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs uppercase font-bold">Thank you for speaking!</p>
                    <p className="text-[10px] text-gray-500">
                        Try it free at presx.app
                    </p>
                </div>

                {/* Barcode (Fake) */}
                <div className="h-12 bg-black w-full opacity-80" style={{
                    maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
                }}>
                    <div className="flex h-full w-full justify-between px-4">
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className="h-full bg-white" style={{ width: Math.random() * 4 + 1 }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Zigzag Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-[linear-gradient(45deg,transparent_50%,#f0f0f0_50%),linear-gradient(-45deg,transparent_50%,#f0f0f0_50%)] bg-[length:20px_20px] transform rotate-180" />
        </div>
    );
};
