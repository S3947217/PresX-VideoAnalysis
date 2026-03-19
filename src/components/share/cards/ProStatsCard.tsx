import React from "react";
import { Project } from "@/types/project";
import { Brain, Mic, Zap, Layout, BookOpen, Activity, AlertTriangle, Clock, FastForward } from "lucide-react";

interface ProStatsCardProps {
    project: Project;
    capture?: boolean;
}

export const ProStatsCard: React.FC<ProStatsCardProps> = ({ project, capture }) => {
    const analysis = project.analysis;
    if (!analysis) return null;

    const score = analysis.overallScore;

    const stats = [
        { label: "Fluency", value: analysis.subscores.fluency ?? 0, icon: Zap },
        { label: "Pacing", value: analysis.subscores.pacing ?? 0, icon: Activity },
        { label: "Clarity", value: analysis.subscores.clarity ?? 0, icon: Mic },
        { label: "Structure", value: analysis.subscores.structureAndFlow ?? 0, icon: Layout },
        { label: "Engagement", value: analysis.subscores.engagement ?? 0, icon: Brain },
        { label: "Vocabulary", value: analysis.subscores.vocabularyEffectiveness ?? 0, icon: BookOpen },
    ];

    const metrics = [
        { label: "WPM", value: analysis.metrics.estimatedWPM ?? 0, icon: FastForward },
        { label: "Fillers", value: analysis.metrics.fillerWordCount ?? 0, icon: AlertTriangle },
        { label: "Avg Pause", value: analysis.metrics.averagePauseSeconds != null ? `${analysis.metrics.averagePauseSeconds.toFixed(1)}s` : "0s", icon: Clock },
        { label: "Issues", value: analysis.metrics.unclearSegments ?? 0, icon: Mic },
    ];

    const rows = [stats.slice(0, 2), stats.slice(2, 4), stats.slice(4, 6)];

    // capture = fixed 1080x1080 for html2canvas (uses only flexbox, no CSS grid)
    if (capture) {
        return (
            <div style={{ width: 1080, height: 1080, backgroundColor: "#000", color: "#fff", fontFamily: "system-ui, sans-serif", padding: 48, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>{project.topic || project.name}</div>
                        <div>
                            <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>{score}</span>
                            <span style={{ fontSize: 20, color: "#4b5563", marginLeft: 10 }}>/100</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 3, marginTop: 32 }}>Overall Score</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", paddingTop: 6 }}>
                        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1 }}>PresX</span>
                        <span style={{ fontSize: 26, fontWeight: 700, color: "#5e17eb" }}>.</span>
                    </div>
                </div>

                {/* Stats - 3 rows of 2 */}
                <div style={{ marginTop: 0 }}>
                    {rows.map((row, rowIdx) => (
                        <div key={rowIdx} style={{ display: "flex", marginBottom: rowIdx < 2 ? 14 : 0 }}>
                            {row.map((stat, colIdx) => (
                                <div key={stat.label} style={{
                                    flex: 1,
                                    marginRight: colIdx === 0 ? 14 : 0,
                                    backgroundColor: "#111",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 16,
                                    padding: "18px 24px 20px",
                                    overflow: "hidden",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#d1d5db", textTransform: "uppercase", letterSpacing: 2 }}>{stat.label}</span>
                                        <stat.icon style={{ width: 18, height: 18, color: "#5e17eb" }} />
                                    </div>
                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ marginBottom: 16 }}>
                                            <span style={{ fontSize: 42, fontWeight: 700 }}>{stat.value}</span>
                                            <span style={{ fontSize: 14, color: "#4b5563", marginLeft: 8 }}>/100</span>
                                        </div>
                                        <div style={{ height: 6, width: "100%", backgroundColor: "#1f2937", borderRadius: 6, overflow: "hidden" }}>
                                            <div style={{ height: 6, width: `${stat.value}%`, background: "linear-gradient(to right, #5e17eb, #a152ff)", borderRadius: 6 }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Metrics */}
                <div style={{ display: "flex" }}>
                    {metrics.map((metric, i) => (
                        <div key={metric.label} style={{
                            flex: 1,
                            marginRight: i < 3 ? 14 : 0,
                            backgroundColor: "#080808",
                            border: "1px solid #2a2a2a",
                            borderRadius: 16,
                            padding: "14px 10px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                        }}>
                            <metric.icon style={{ width: 16, height: 16, color: "#9ca3af", marginBottom: 6 }} />
                            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, lineHeight: 1 }}>{metric.value}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 2 }}>{metric.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Responsive version using container query units (cqi)
    return (
        <div
            style={{ containerType: "inline-size" }}
            className="w-full"
        >
            <div
                className="w-full bg-black text-white flex flex-col"
                style={{ padding: "4.4cqi" }}
            >
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <div style={{ fontSize: "1.7cqi", fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.35cqi", marginBottom: "1cqi" }}>
                            {project.topic || project.name}
                        </div>
                        <div className="flex items-baseline">
                            <span style={{ fontSize: "8.2cqi", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.3cqi" }}>{score}</span>
                            <span style={{ fontSize: "2cqi", color: "#4b5563", marginLeft: "1cqi" }}>/100</span>
                        </div>
                        <div style={{ fontSize: "1.5cqi", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.35cqi", marginTop: "0.5cqi" }}>
                            Overall Score
                        </div>
                    </div>
                    <div className="flex items-baseline" style={{ paddingTop: "0.7cqi" }}>
                        <span style={{ fontSize: "2.6cqi", fontWeight: 700, letterSpacing: "-0.1cqi" }}>PresX</span>
                        <span style={{ fontSize: "2.6cqi", fontWeight: 700, color: "#5e17eb" }}>.</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div
                    className="grid grid-cols-2"
                    style={{ gap: "1.5cqi", marginTop: "3cqi" }}
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex flex-col justify-between"
                            style={{
                                backgroundColor: "#111111",
                                border: "1px solid #2a2a2a",
                                borderRadius: "1.5cqi",
                                padding: "1.7cqi 2cqi",
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <span style={{ fontSize: "1.3cqi", fontWeight: 700, color: "#d1d5db", textTransform: "uppercase", letterSpacing: "0.2cqi" }}>{stat.label}</span>
                                <stat.icon style={{ width: "1.7cqi", height: "1.7cqi", color: "#5e17eb" }} />
                            </div>
                            <div>
                                <div className="flex items-baseline" style={{ gap: "0.7cqi", marginBottom: "0.8cqi" }}>
                                    <span style={{ fontSize: "3.5cqi", fontWeight: 700, lineHeight: 1 }}>{stat.value}</span>
                                    <span style={{ fontSize: "1.3cqi", color: "#4b5563" }}>/100</span>
                                </div>
                                <div style={{ height: "0.45cqi", width: "100%", backgroundColor: "#111827", borderRadius: "0.3cqi", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${stat.value}%`, background: "linear-gradient(to right, #5e17eb, #a152ff)", borderRadius: "0.3cqi" }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Metrics */}
                <div
                    className="grid grid-cols-4"
                    style={{ gap: "1.3cqi", marginTop: "2cqi" }}
                >
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="flex flex-col items-center justify-center text-center"
                            style={{
                                backgroundColor: "#080808",
                                border: "1px solid #2a2a2a",
                                borderRadius: "1.5cqi",
                                padding: "1.3cqi 1cqi",
                            }}
                        >
                            <metric.icon style={{ width: "1.5cqi", height: "1.5cqi", color: "#9ca3af", marginBottom: "0.6cqi" }} />
                            <div style={{ fontSize: "2.1cqi", fontWeight: 700, marginBottom: "0.4cqi", lineHeight: 1 }}>{metric.value}</div>
                            <div style={{ fontSize: "0.85cqi", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.2cqi" }}>{metric.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
