export type CriterionKey =
    | "fluency"
    | "pacing"
    | "clarity"
    | "structureAndFlow"
    | "engagement"
    | "vocabularyEffectiveness";

export type Subscores = Partial<Record<CriterionKey, number>>;

export interface CriterionFeedbackDetail {
    morale: string;
    whatWentWell: string[];
    whatToImprove: string[];
    nextStep: string;
}

export type CriterionFeedback = Partial<Record<CriterionKey, CriterionFeedbackDetail>>;

export interface Metrics {
    estimatedWPM: number;
    fillerWordCount: number;
    fillerWordsPerMinute: number;
    longPauses: number;
    averagePauseSeconds: number;
    silenceRatio: number;
    unclearSegments: number;
}

export interface EvidenceMoment {
    startSecond: number;
    endSecond: number;
    criterion: CriterionKey;
    label: string;
    note: string;
}

export interface ImprovementPriority {
    criterion: CriterionKey;
    priority: number;
    why: string;
}

export interface PracticeDrill {
    title: string;
    durationMinutes: number;
    instructions: string;
}

export interface ImprovementPlan {
    topPriorities: ImprovementPriority[];
    practiceDrills: PracticeDrill[];
    nextRecordingGoal: string;
}

export interface AnalysisResult {
    criteria?: CriterionKey[];
    overallScore: number;
    subscores: Subscores;
    criterionFeedback: CriterionFeedback;
    metrics: Metrics;
    evidenceMoments: EvidenceMoment[];
    overallImprovementPlan: ImprovementPlan;
    finalMorale: string;
    privacyNote: string;
}

export interface AnalysisRun {
    id: string;
    createdAt: string; // ISO string
    analysis: AnalysisResult;
    s3Key?: string;
}

export interface Project {
    id: string;
    name: string;
    purpose: string;
    audience: string;
    topic?: string;
    createdAt: string; // ISO string
    analysis: AnalysisResult | null;
    analysisHistory?: AnalysisRun[];
}

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface AnalysisJobResponse {
    jobId: string;
    status: JobStatus;
    result?: AnalysisResult;
    error?: string;
}

export interface SubscriptionStatus {
    plan: "trial" | "pro" | "master" | "free";
    status: string;
    trialEndsAt: string | null;
    trialDaysRemaining: number | null;
    trialHoursRemaining: number | null;
    dailyAnalysesUsed: number;
    dailyAnalysesLimit: number;
    maxCriteria: number;
    canAnalyze: boolean;
    currentPeriodEnd: string | null;
}
