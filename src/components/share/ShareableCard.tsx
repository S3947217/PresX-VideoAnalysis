"use client";

import React, { useRef, useState, useCallback } from "react";
import { Project } from "@/types/project";
import { ProStatsCard } from "./cards/ProStatsCard";
import { Download, Link as LinkIcon, Check } from "lucide-react";
import html2canvas from "html2canvas";

interface ShareableCardProps {
    project: Project;
    shareUrl?: string;
}

export const ShareableCard: React.FC<ShareableCardProps> = ({ project, shareUrl: shareUrlProp }) => {
    const captureRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const generateImage = useCallback(async (): Promise<Blob | null> => {
        if (!captureRef.current) return null;
        await document.fonts.ready;
        const canvas = await html2canvas(captureRef.current, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            backgroundColor: "#000000",
            width: 1080,
            height: 1080,
            logging: false,
            onclone: (clonedDoc) => {
                const el = clonedDoc.querySelector("[data-capture-target]") as HTMLElement;
                if (el) {
                    el.style.left = "0px";
                }
            },
        });
        return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    }, []);

    const handleDownload = useCallback(async () => {
        try {
            const blob = await generateImage();
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `PresX-Stats-${project.id.slice(0, 8)}.png`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            // silently fail
        }
    }, [generateImage, project.id]);

    const shareToSocial = useCallback(async (platform: "twitter" | "linkedin" | "whatsapp" | "instagram" | "copy") => {
        const shareUrl = shareUrlProp || window.location.href;
        const text = `I scored ${project.analysis?.overallScore}/100 on my presentation using PresX! 🚀`;

        if ((platform === "whatsapp" || platform === "instagram") && navigator.share) {
            try {
                const blob = await generateImage();
                if (blob) {
                    const file = new File([blob], `PresX-Stats.png`, { type: "image/png" });
                    if (navigator.canShare?.({ files: [file] })) {
                        await navigator.share({ title: "My PresX Analysis", text, url: shareUrl, files: [file] });
                        return;
                    }
                }
            } catch {
                // fall through
            }
        }

        switch (platform) {
            case "twitter":
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
                break;
            case "linkedin":
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
                break;
            case "whatsapp":
                window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`, "_blank");
                break;
            case "instagram":
                await handleDownload();
                break;
            case "copy":
                await navigator.clipboard.writeText(`${text} ${shareUrl}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                break;
        }
    }, [project.analysis?.overallScore, generateImage, handleDownload, shareUrlProp]);

    return (
        <div className="flex flex-col items-center w-full mx-auto">
            {/* Offscreen 1080x1080 for download */}
            <div
                ref={captureRef}
                data-capture-target
                aria-hidden="true"
                style={{ position: "fixed", top: 0, left: -9999, width: 1080, height: 1080, pointerEvents: "none" }}
            >
                <ProStatsCard project={project} capture />
            </div>

            {/* Visible responsive card */}
            <div className="w-full shadow-2xl rounded-2xl overflow-hidden">
                <ProStatsCard project={project} />
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
                <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent-red hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-accent-red/25 text-sm tracking-wide uppercase"
                >
                    <Download size={18} />
                    Download Stats
                </button>

                <div className="space-y-4">
                    <p className="text-center text-sm font-medium text-gray-400">
                        Share your results using <span className="text-white">PresX</span>.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => shareToSocial("whatsapp")} className="p-3 rounded-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] transition-colors border border-[#25D366]/30" aria-label="Share on WhatsApp">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        </button>
                        <button onClick={() => shareToSocial("twitter")} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10" aria-label="Share on X">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </button>
                        <button onClick={() => shareToSocial("linkedin")} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10" aria-label="Share on LinkedIn">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={() => shareToSocial("instagram")} className="p-3 rounded-full bg-[#E1306C]/20 hover:bg-[#E1306C]/30 text-[#E1306C] transition-colors border border-[#E1306C]/30" aria-label="Download for Instagram">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                        </button>
                        <button onClick={() => shareToSocial("copy")} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10" aria-label="Copy Link">
                            {copied ? <Check className="w-5 h-5 text-green-400" /> : <LinkIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
