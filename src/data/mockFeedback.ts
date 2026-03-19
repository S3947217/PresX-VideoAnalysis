import { AnalysisResult } from "@/types/project";

export const MOCK_FEEDBACK: AnalysisResult = {
  "overallScore": 78,

  "subscores": {
    "fluency": 82,
    "pacing": 70,
    "clarity": 80,
    "structureAndFlow": 75,
    "engagement": 72,
    "vocabularyEffectiveness": 68
  },

  "criterionFeedback": {
    "fluency": {
      "morale": "You sound smooth overall — your message comes through without many interruptions.",
      "whatWentWell": [
        "Most sentences are delivered cleanly without restarts",
        "Filler usage stays manageable in the middle section"
      ],
      "whatToImprove": [
        "Reduce filler clusters in short bursts",
        "Replace fillers with a silent pause"
      ],
      "nextStep": "Do a 60-second take where you pause silently instead of saying any filler words."
    },

    "pacing": {
      "morale": "You have good momentum — with a slightly slower start, you’ll sound much more confident.",
      "whatWentWell": [
        "Pace stabilises after the first minute",
        "Pauses are mostly natural in the middle section"
      ],
      "whatToImprove": [
        "Opening section is a bit fast",
        "Add micro-pauses after key points"
      ],
      "nextStep": "Rehearse the first 30 seconds at ~80% speed, focusing on breathing pauses."
    },

    "clarity": {
      "morale": "Your voice is easy to follow — listeners won’t struggle to understand you.",
      "whatWentWell": [
        "Volume is consistent",
        "Most words are clearly articulated"
      ],
      "whatToImprove": [
        "A few segments drop clarity (likely speed or mic distance)",
        "Emphasise key nouns slightly more"
      ],
      "nextStep": "Record once holding a consistent mic distance and slow down on technical terms."
    },

    "structureAndFlow": {
      "morale": "Your ideas mostly land in a logical order — you’re already presenting, not just talking.",
      "whatWentWell": [
        "Clear topic setup",
        "Middle section follows a sensible sequence"
      ],
      "whatToImprove": [
        "Transitions between points could be clearer",
        "Conclusion could summarise the key message more strongly"
      ],
      "nextStep": "Add 3 transition phrases: 'First…', 'Next…', 'Finally…', then end with a 1-sentence summary."
    },

    "engagement": {
      "morale": "You have a steady tone — adding a bit more vocal variety will make you sound more persuasive.",
      "whatWentWell": [
        "Energy is consistent (no major drop-offs)",
        "Key moments are not rushed"
      ],
      "whatToImprove": [
        "Some sections are a bit flat",
        "Increase emphasis on your main claim"
      ],
      "nextStep": "Pick 2 key sentences and deliberately stress 1–2 words in each."
    },

    "vocabularyEffectiveness": {
      "morale": "Your language is understandable and accessible — tightening a few phrases will make it feel sharper.",
      "whatWentWell": [
        "Vocabulary is generally appropriate for the audience",
        "Very little confusing jargon"
      ],
      "whatToImprove": [
        "A few vague words reduce impact ('things', 'stuff', 'basically')",
        "Some repetition of the same phrases"
      ],
      "nextStep": "Replace 3 vague words with specifics (numbers, examples, or named features)."
    }
  },

  "metrics": {
    "estimatedWPM": 168,
    "fillerWordCount": 14,
    "fillerWordsPerMinute": 4.2,
    "longPauses": 6,
    "averagePauseSeconds": 0.9,
    "silenceRatio": 0.12,
    "unclearSegments": 3
  },

  "evidenceMoments": [
    {
      "startSecond": 12,
      "endSecond": 38,
      "criterion": "pacing",
      "label": "Too fast in opening",
      "note": "Rapid delivery reduced clarity and listener processing time."
    },
    {
      "startSecond": 65,
      "endSecond": 80,
      "criterion": "fluency",
      "label": "Filler burst",
      "note": "Multiple filler words in a short window disrupted flow."
    },
    {
      "startSecond": 140,
      "endSecond": 155,
      "criterion": "engagement",
      "label": "Low vocal variation",
      "note": "Tone stayed flat during a key point; adding emphasis would increase impact."
    }
  ],

  "overallImprovementPlan": {
    "topPriorities": [
      {
        "criterion": "pacing",
        "priority": 1,
        "why": "Your opening sets the listener’s first impression; slowing slightly boosts clarity and confidence."
      },
      {
        "criterion": "fluency",
        "priority": 2,
        "why": "Reducing filler bursts will make your delivery feel more polished."
      },
      {
        "criterion": "structureAndFlow",
        "priority": 3,
        "why": "Clear transitions and a stronger closing improve persuasion and memorability."
      }
    ],
    "practiceDrills": [
      {
        "title": "80% Speed Opening",
        "durationMinutes": 3,
        "instructions": "Repeat the first 30 seconds twice: first slow, then normal speed while keeping the same pauses."
      },
      {
        "title": "Silent Pause Challenge",
        "durationMinutes": 2,
        "instructions": "Do a 60–90 second run where filler words are not allowed—only silent pauses."
      },
      {
        "title": "3-Point Structure Template",
        "durationMinutes": 4,
        "instructions": "Speak using: Intro (1 line) → Point 1/2/3 (1 line each) → Summary (1 line)."
      }
    ],
    "nextRecordingGoal": "Hit 150–165 WPM in the first 30 seconds and reduce filler bursts to ≤2 per minute."
  },

  "finalMorale": "You’re already communicating clearly. Focus on a calmer opening and cleaner filler control — you’ll sound noticeably more professional in your next recording.",

  "privacyNote": "No transcript was generated or stored."
};
