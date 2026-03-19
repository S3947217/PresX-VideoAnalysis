import React from "react";
import {
    Star,
    Zap,
    Activity,
    GitGraph,
    BookOpen,
    Clock,
    Mic,
    AlertTriangle,
    Target,
    Dumbbell,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { AnalysisResult, CriterionFeedbackDetail, ImprovementPriority, PracticeDrill, CriterionKey } from "@/types/project";
import { CRITERIA, CRITERIA_KEYS } from "@/lib/criteria";
import { useState } from "react";

interface FeedbackDisplayProps {
    data: AnalysisResult | null;
}

const ScoreCard = ({ label, score, icon: Icon }: { label: string; score: number; icon: any }) => (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</span>
            <Icon className="w-4 h-4 text-accent-red" />
        </div>
        <div className="flex items-end gap-2">
            <span className="text-4xl font-display font-bold text-white">{score}</span>
            <span className="text-sm text-gray-500 mb-1.5">/100</span>
        </div>
        <div className="mt-3 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-accent-red to-red-500 rounded-full transition-all duration-1000"
                style={{ width: `${score}%` }}
            />
        </div>
    </div>
);

const CRITERIA_LABELS = CRITERIA.reduce((acc, item) => {
    acc[item.key] = item.label;
    return acc;
}, {} as Record<CriterionKey, string>);

const CRITERIA_ICONS: Record<CriterionKey, any> = {
    fluency: Zap,
    pacing: Activity,
    clarity: Mic,
    structureAndFlow: GitGraph,
    engagement: Star,
    vocabularyEffectiveness: BookOpen,
};

const FeedbackSection = ({
    title,
    data,
    icon: Icon
}: {
    title: string;
    data: CriterionFeedbackDetail;
    icon: any
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-transparent">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-accent-red">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white capitalize">{title}</h3>
                        <p className="text-gray-400 text-sm mt-1">{data.morale}</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>

            {isOpen && (
                <div className="p-6 pt-0 border-t border-white/5 bg-white/[0.02]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                            <h4 className="flex items-center gap-2 text-green-400 text-sm font-bold uppercase tracking-widest mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> What Went Well
                            </h4>
                            <ul className="space-y-3">
                                {data.whatWentWell.map((item, i) => (
                                    <li key={i} className="text-gray-300 text-sm leading-relaxed pl-4 border-l border-white/10">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="flex items-center gap-2 text-purple-500 text-sm font-bold uppercase tracking-widest mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Improvement Areas
                            </h4>
                            <ul className="space-y-3">
                                {data.whatToImprove.map((item, i) => (
                                    <li key={i} className="text-gray-300 text-sm leading-relaxed pl-4 border-l border-white/10">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 p-4 bg-accent-red/5 border border-accent-red/20 rounded-lg">
                        <h4 className="text-accent-red text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Quick Fix
                        </h4>
                        <p className="text-white text-sm">{data.nextStep}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const PriorityCard = ({ item, index }: { item: ImprovementPriority; index: number }) => {
    const label = CRITERIA_LABELS[item.criterion] || item.criterion;
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white text-black font-bold rounded-full">
                {index + 1}
            </span>
            <div>
                <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-1">{label}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{item.why}</p>
            </div>
        </div>
    );
};

const DrillCard = ({ drill }: { drill: PracticeDrill }) => (
    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-xl">
        <div className="flex justify-between items-start mb-4">
            <h4 className="font-bold text-white text-lg">{drill.title}</h4>
            <div className="flex flex-col items-end gap-1">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Suggested Practice Time</span>
                <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {drill.durationMinutes} min
                </span>
            </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{drill.instructions}</p>
    </div>
);

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ data }) => {
    if (!data) return null;

    const selectedCriteria = (data.criteria && data.criteria.length > 0)
        ? data.criteria
        : CRITERIA_KEYS.filter((key) =>
            data.subscores?.[key] !== undefined || data.criterionFeedback?.[key]
        );

    const scoreCriteria = selectedCriteria.filter((key) => typeof data.subscores?.[key] === "number");
    const feedbackCriteria = selectedCriteria.filter((key) => data.criterionFeedback?.[key]);

    return (
        <div className="w-full space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10">
                <div className="text-center md:text-left space-y-4 max-w-2xl">
                    <h2 className="text-3xl font-display font-bold text-white">Analysis Complete</h2>
                    <p className="text-xl text-gray-300 leading-relaxed font-light">{data.finalMorale}</p>
                </div>
                <div className="flex-shrink-0 text-center p-6 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="text-6xl font-display font-bold text-white mb-2">{data.overallScore}</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-accent-red">Overall Score</div>
                </div>
            </div>

            {/* Subscores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scoreCriteria.map((key) => {
                    const score = data.subscores?.[key];
                    if (typeof score !== "number") return null;
                    return (
                        <ScoreCard
                            key={key}
                            label={CRITERIA_LABELS[key] || key}
                            score={score}
                            icon={CRITERIA_ICONS[key]}
                        />
                    );
                })}
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 border-b border-white/10">
                {[
                    { label: "WPM", value: data.metrics.estimatedWPM, icon: Activity },
                    { label: "Fillers", value: data.metrics.fillerWordCount, icon: AlertTriangle },
                    { label: "Avg Pause", value: `${data.metrics.averagePauseSeconds}s`, icon: Clock },
                    { label: "Clarity Issues", value: data.metrics.unclearSegments, icon: Mic },
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                        <stat.icon className="w-5 h-5 text-gray-500 mb-2" />
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                        <span className="text-xs uppercase tracking-widest text-gray-500">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Detailed Feedback Sections */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Detailed Analysis</h3>
                {feedbackCriteria.map((key) => {
                    const detail = data.criterionFeedback?.[key];
                    if (!detail) return null;
                    return (
                        <FeedbackSection
                            key={key}
                            title={CRITERIA_LABELS[key] || key}
                            data={detail}
                            icon={CRITERIA_ICONS[key]}
                        />
                    );
                })}
            </div>

            {/* Improvement Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 text-accent-red" />
                        <h3 className="text-xl font-display font-bold text-white">Top Priorities</h3>
                    </div>
                    <div className="space-y-4">
                        {data.overallImprovementPlan.topPriorities.map((item, i) => (
                            <PriorityCard key={i} item={item} index={i} />
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Dumbbell className="w-5 h-5 text-accent-red" />
                        <h3 className="text-xl font-display font-bold text-white">Practice Drills</h3>
                    </div>
                    <div className="space-y-4">
                        {data.overallImprovementPlan.practiceDrills.map((drill, i) => (
                            <DrillCard key={i} drill={drill} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Next Goal Footer */}
            <div className="p-8 bg-gradient-to-r from-accent-red/20 to-transparent border border-accent-red/30 rounded-xl text-center">
                <h4 className="text-accent-red font-bold uppercase tracking-widest text-sm mb-2">Next Recording Goal</h4>
                <p className="text-white text-xl md:text-2xl font-display">{data.overallImprovementPlan.nextRecordingGoal}</p>
            </div>
        </div>
    );
};

export default FeedbackDisplay;
