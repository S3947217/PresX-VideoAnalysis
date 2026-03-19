export type CriterionKey =
  | "fluency"
  | "pacing"
  | "clarity"
  | "structureAndFlow"
  | "engagement"
  | "vocabularyEffectiveness";

export const CRITERIA_KEYS: CriterionKey[] = [
  "fluency",
  "pacing",
  "clarity",
  "structureAndFlow",
  "engagement",
  "vocabularyEffectiveness",
];

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
  createdAt: string;
  analysis: AnalysisResult;
  s3Key?: string;
}

export interface Project {
  id: string;
  name: string;
  purpose: string;
  audience: string;
  topic?: string;
  createdAt: string;
  analysis: AnalysisResult | null;
  analysisHistory?: AnalysisRun[];
}

export interface ProjectItem {
  PK: string;
  SK: string;
  id: string;
  name: string;
  purpose: string;
  audience: string;
  topic?: string;
  createdAt: string;
  analysis: AnalysisResult | null;
  analysisHistory?: AnalysisRun[];
}

export interface SubscriptionItem {
  PK: string;
  SK: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: "free" | "trial" | "pro" | "master";
  status: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  dailyLimit?: number;
  couponCode?: string;
}

export interface CouponItem {
  code: string;
  trialDays: number;
  dailyLimit: number;
  active: boolean;
  description?: string;
}

export interface UsageItem {
  PK: string;
  SK: string;
  analysisCount: number;
  ttl: number;
}

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface AnalysisJobItem {
  PK: string;       // USER#userId
  SK: string;       // JOB#jobId
  jobId: string;
  status: JobStatus;
  result?: AnalysisResult;
  error?: string;
  /** Payload passed to async worker */
  payload: {
    s3Key: string;
    purpose: string;
    audience: string;
    topic: string;
    criteria: CriterionKey[];
    projectId?: string;
  };
  createdAt: string;
  ttl: number;      // 24-hour auto-cleanup
}
