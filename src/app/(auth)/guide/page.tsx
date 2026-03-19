"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Headphones,
  FileText,
  Zap,
  Activity,
  Mic,
  GitBranch,
  Star,
  BookOpen,
  CheckCircle2,
  XCircle,
  Target,
} from "lucide-react";

const DIMENSIONS = [
  {
    icon: Zap,
    label: "Fluency",
    what: "How smoothly you speak without stumbles, false starts, or filler-word clusters.",
    good: "Natural flow with minimal disruptions. Self-corrections are quick and seamless.",
    improve: "Frequent \"um\", \"uh\", or repeated words. Sentences trail off or restart often.",
  },
  {
    icon: Activity,
    label: "Pacing",
    what: "Your speed, rhythm, and use of pauses. Are pauses intentional or nervous?",
    good: "Varied tempo that emphasises key points. Pauses feel deliberate and give the audience time to absorb.",
    improve: "Rushing through content, monotonous speed, or long awkward silences mid-thought.",
  },
  {
    icon: Mic,
    label: "Clarity",
    what: "Pronunciation, articulation, and how easy you are to understand.",
    good: "Every word is crisp and intelligible. Enunciation matches the audience level.",
    improve: "Mumbling, swallowing word endings, or unclear segments that require listener effort.",
  },
  {
    icon: GitBranch,
    label: "Structure & Flow",
    what: "How well your ideas are organized, sequenced, and connected with transitions.",
    good: "Clear opening, logical progression, smooth transitions, and a strong close.",
    improve: "Jumping between topics, missing transitions, or no clear beginning/middle/end.",
  },
  {
    icon: Star,
    label: "Engagement",
    what: "Your energy, vocal variety, and ability to hold the listener's attention.",
    good: "Dynamic tone with emphasis on key moments. The audience wants to keep listening.",
    improve: "Flat, monotone delivery. No variation in pitch or energy. Feels like reading aloud.",
  },
  {
    icon: BookOpen,
    label: "Vocabulary",
    what: "Word choice and precision for your audience and topic.",
    good: "Precise, audience-appropriate language. Technical terms are explained when needed.",
    improve: "Vague or repetitive word choices. Jargon without context, or overly casual phrasing.",
  },
];

const SCORE_RANGES = [
  { range: "90-100", label: "World-class", desc: "TED Talk and keynote level. Rare — reserved for genuinely exceptional delivery.", color: "bg-green-500" },
  { range: "70-89", label: "Strong", desc: "Polished professional speaker. Confident, clear, and well-structured with minimal issues.", color: "bg-emerald-500" },
  { range: "50-69", label: "Average", desc: "Understandable but has noticeable weaknesses in pacing, clarity, or structure.", color: "bg-yellow-500" },
  { range: "30-49", label: "Below average", desc: "Listener effort required. Credibility or clarity drops significantly.", color: "bg-orange-500" },
  { range: "0-29", label: "Needs work", desc: "Hard to follow. Significant issues across clarity, fluency, or confidence.", color: "bg-red-500" },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-accent-red/30">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 md:px-12 pt-8 pb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <Image
          src="/presx-logo.png"
          alt="PresX"
          width={240}
          height={90}
          className="h-20 md:h-28 w-auto object-contain"
          priority
        />
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-12 pb-24 space-y-20">

        {/* Hero */}
        <section className="text-center space-y-6 pt-8">
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
            How Scoring Works
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            PresX doesn&apos;t just read a transcript. It <span className="text-white font-semibold">listens</span> to your actual voice — the way a real audience would.
          </p>
        </section>

        {/* Audio vs Text - Key differentiator */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-center">
            Why audio analysis matters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PresX - Audio */}
            <div className="relative border-2 border-accent-red/50 bg-white/[0.03] rounded-2xl p-8 space-y-6">
              <span className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent-red text-white rounded-full">
                PresX
              </span>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-accent-red" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">We listen to you</h3>
                  <p className="text-sm text-gray-400">Audio-first analysis</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Detects tone, confidence, and vocal energy",
                  "Hears filler words, hesitations, and stumbles",
                  "Measures actual speaking pace and pauses",
                  "Catches mumbling and unclear pronunciation",
                  "Evaluates rhythm and vocal variety",
                  "Understands emphasis and intonation patterns",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Text-only */}
            <div className="border border-white/10 bg-white/[0.03] rounded-2xl p-8 space-y-6 opacity-60">
              <span className="absolute -top-3 left-6" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-gray-400">Text-only tools</h3>
                  <p className="text-sm text-gray-500">Transcript-based analysis</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Only sees the words, not how you said them",
                  "Can't detect tone, confidence, or energy",
                  "Misses filler sounds and hesitations",
                  "No awareness of pacing or pauses",
                  "Can't evaluate pronunciation or clarity",
                  "Rhythm and vocal dynamics are invisible",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-gray-600" />
                    <span className="text-gray-500">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
            A transcript can tell you <em>what</em> was said. Only audio reveals <em>how</em> it was said — and that&apos;s what your audience actually experiences.
          </p>
        </section>

        {/* 6 Dimensions */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              6 scoring dimensions
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every analysis evaluates your presentation across six key areas of effective communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DIMENSIONS.map((d) => (
              <div
                key={d.label}
                className="border border-white/10 bg-white/[0.03] rounded-2xl p-6 space-y-4 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
                    <d.icon className="w-4 h-4 text-accent-red" />
                  </div>
                  <h3 className="text-lg font-display font-bold">{d.label}</h3>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed">{d.what}</p>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-400" />
                    <p className="text-xs text-gray-300 leading-relaxed">{d.good}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-400" />
                    <p className="text-xs text-gray-400 leading-relaxed">{d.improve}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Score Ranges */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              What your score means
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Scores are calibrated to professional standards. Most casual speakers score 40-70 — an 80+ genuinely means strong delivery.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {SCORE_RANGES.map((s) => (
              <div
                key={s.range}
                className="flex items-center gap-5 p-5 border border-white/10 bg-white/[0.03] rounded-xl"
              >
                <div className={`w-3 h-12 rounded-full ${s.color} shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono font-bold text-lg text-white">{s.range}</span>
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-400">{s.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              Tips for better scores
            </h2>
          </div>

          <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Speak to the mic", tip: "Record in a quiet space. Clear audio = more accurate analysis." },
              { title: "Don't rush", tip: "Deliberate pacing with intentional pauses always scores higher than speed." },
              { title: "Practise out loud", tip: "Reading silently doesn't build delivery skills. Say it like you mean it." },
              { title: "Record, review, re-record", tip: "Compare attempts side-by-side. Small changes compound into big improvements." },
              { title: "Structure your talk", tip: "A clear opening, 2-3 key points, and a strong close make a huge difference." },
              { title: "Vary your energy", tip: "Monotone kills engagement. Emphasise key words and use your voice dynamically." },
            ].map((t) => (
              <div key={t.title} className="p-4 border border-white/10 bg-white/[0.03] rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-white">{t.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/new"
            className="inline-flex items-center gap-2 bg-accent-red hover:bg-purple-700 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 active:scale-95 uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(255,77,77,0.4)]"
          >
            Start Practicing
          </Link>
        </section>
      </div>
    </main>
  );
}
