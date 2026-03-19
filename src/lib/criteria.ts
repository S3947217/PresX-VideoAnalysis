import { CriterionKey } from "@/types/project";

export const CRITERIA: { key: CriterionKey; label: string; description: string }[] = [
    {
        key: "fluency",
        label: "Fluency",
        description: "Smooth delivery without stumbles or filler clusters.",
    },
    {
        key: "pacing",
        label: "Pacing",
        description: "Speed, rhythm, and pauses that feel intentional.",
    },
    {
        key: "clarity",
        label: "Clarity",
        description: "Pronunciation, articulation, and intelligibility.",
    },
    {
        key: "structureAndFlow",
        label: "Structure & Flow",
        description: "Organization, sequencing, and transitions.",
    },
    {
        key: "engagement",
        label: "Engagement",
        description: "Energy, emphasis, and attention holding.",
    },
    {
        key: "vocabularyEffectiveness",
        label: "Vocabulary",
        description: "Word choice and precision for the audience.",
    },
];

export const CRITERIA_KEYS: CriterionKey[] = CRITERIA.map((item) => item.key);
