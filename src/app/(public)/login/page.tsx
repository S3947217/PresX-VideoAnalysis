"use client";

import React, { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowRight,
  Mic,
  BarChart3,
  RefreshCw,
  Zap,
  ChevronDown,
  Shield,
  Clock,
  Layers,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/* ─── Constants ─── */

const HERO_WORDS = [
  "fluency",
  "structure",
  "delivery",
  "vocabulary",
  "pacing",
  "clarity",
  "presence",
  "storytelling",
  "confidence",
  "intonation",
  "brevity",
];

const getRandomNextIndex = (
  currentIndex: number,
  length: number,
  recent: number[] = []
) => {
  if (length <= 1) return currentIndex;

  const excluded = new Set([currentIndex, ...recent]);
  const candidates = Array.from({ length }, (_, i) => i).filter(
    (i) => !excluded.has(i)
  );

  if (candidates.length === 0) {
    // fallback: only avoid current index
    const fallback = Array.from({ length }, (_, i) => i).filter(
      (i) => i !== currentIndex
    );
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

const FEATURES = [
  {
    icon: Mic,
    title: "Record",
    desc: "Record directly in the browser or upload an existing file. Trim to the exact section you want analyzed.",
    step: "01",
  },
  {
    icon: BarChart3,
    title: "Analyze",
    desc: "We score your speech across six dimensions — fluency, pacing, clarity, structure, engagement, and vocabulary.",
    step: "02",
  },
  {
    icon: RefreshCw,
    title: "Improve",
    desc: "Get actionable, evidence-backed feedback. Re-record and compare attempts to track your growth over time.",
    step: "03",
  },
];

const STATS = [
  { icon: Layers, value: "6", label: "Dimensions Scored" },
  { icon: Clock, value: "<30s", label: "Analysis Time" },
  { icon: Shield, value: "100%", label: "Private & Secure" },
];

const SCORE_PREVIEW = [
  { name: "Fluency", score: 78 },
  { name: "Pacing", score: 65 },
  { name: "Clarity", score: 82 },
  { name: "Structure", score: 70 },
  { name: "Engagement", score: 58 },
  { name: "Vocabulary", score: 75 },
];

const PLANS = [
  {
    name: "Free Trial",
    price: "A$0",
    period: "",
    subtitle: "3 days, no card required",
    features: [
      "5 analyses per day",
      "All criteria per analysis",
      "Scorecard & detailed feedback",
      "Unlimited recordings",
    ],
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    price: "A$4.99",
    period: "/mo",
    subtitle: "Billed monthly, cancel anytime",
    features: [
      "15 analyses per day",
      "Unlimited criteria per analysis",
      "Scorecard & detailed feedback",
      "Unlimited recordings",
      "Custom prompting (coming soon)",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Master",
    price: "A$3.99",
    period: "/mo",
    subtitle: "A$47.88 billed annually",
    features: [
      "25 analyses per day",
      "Unlimited criteria per analysis",
      "Scorecard & detailed feedback",
      "Unlimited recordings",
      "Custom prompting (coming soon)",
    ],
    highlight: false,
    badge: "20% Off",
  },
];

/* ─── Hooks ─── */

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ─── Cycling Word (typewriter + gradient shimmer) ─── */

function CyclingWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentIndexes, setRecentIndexes] = useState<number[]>([]);

  useEffect(() => {
    const current = HERO_WORDS[wordIndex];

    if (!isDeleting && text === current) {
      // Pause before deleting
      const pause = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(pause);
    }

    if (isDeleting && text === "") {
      // Move to random next word
      setIsDeleting(false);
      setWordIndex((prev) => {
        const next = getRandomNextIndex(prev, HERO_WORDS.length, recentIndexes);
        setRecentIndexes((r) => [...r, next].slice(-4));
        return next;
      });
      return;
    }

    const speed = isDeleting ? 60 : 140;
    const timeout = setTimeout(() => {
      setText(
        isDeleting
          ? current.slice(0, text.length - 1)
          : current.slice(0, text.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, recentIndexes]);

  return (
    <span className="inline-block">
      <span className="bg-gradient-to-r from-accent-red via-purple-500 to-accent-red bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
        {text}
      </span>
      <span className="inline-block w-[3px] md:w-[4px] h-[0.85em] bg-accent-red ml-1 align-middle animate-pulse" />
      {text.length > 0 && <span className="text-white">.</span>}
    </span>
  );
}

/* ─── Animated Score Bar (for preview card) ─── */

function ScoreBar({ name, score, delay, animate }: { name: string; score: number; delay: number; animate: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 transition-all duration-700 ${animate ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="text-xs text-gray-400 w-20 text-right">{name}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-red to-purple-500 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: animate ? `${score}%` : "0%",
            transitionDelay: `${delay + 200}ms`,
          }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 tabular-nums">{score}</span>
    </div>
  );
}

/* ─── Page ─── */

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LandingContent />
    </Suspense>
  );
}

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect") || "/";
  const verified = searchParams.get("verified") === "true";
  const resetSuccess = searchParams.get("reset") === "success";

  const [featuresRef, featuresInView] = useInView(0.15);
  const [previewRef, previewInView] = useInView(0.3);
  const [pricingRef, pricingInView] = useInView(0.15);
  const [signInRef, signInInView] = useInView(0.15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace(decodeURIComponent(redirect));
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-accent-red/30 overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Image
            src="/presx-logo.png"
            alt="PresX"
            width={240}
            height={90}
            className="h-20 md:h-28 lg:h-32 w-auto object-contain"
            priority
          />
          <div className="flex items-center gap-6">
            <button
              onClick={scrollToForm}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </button>
            <Link
              href="/signup"
              className="bg-accent-red hover:bg-purple-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-32 md:pt-40 lg:pt-44 overflow-hidden">
        {/* Background: Grid pattern with radial mask */}
        <div
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Background: Floating gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-accent-red/15 blur-[120px] animate-float-1" />
        <div className="absolute bottom-1/3 -right-32 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] animate-float-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-accent-red/5 blur-[80px] animate-pulse-glow" />

        {/* Hero content */}
          <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8">
          {/* Eyebrow pill */}
          <div
            className="opacity-0 animate-slidein"
            style={{ animationDelay: "0ms" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-widest text-gray-400">
              <Zap className="w-3 h-3 text-accent-red" />
              Your Presentation Expert
            </span>
          </div>

          {/* Headline with cycling gradient word */}
          <h1
            className="opacity-0 animate-slidein text-[2.25rem] sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.9] tracking-tighter"
            style={{ animationDelay: "150ms" }}
          >
            <span className="inline-block whitespace-nowrap">Master your <CyclingWord /></span>
            <br />
            <span className="text-gray-500">Confidence starts here.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="opacity-0 animate-slidein text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            style={{ animationDelay: "300ms" }}
          >
            Record your presentation. Get instant feedback across six
            dimensions. Track your improvement over time.
          </p>

          {/* CTAs */}
          <div
            className="opacity-0 animate-slidein flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            style={{ animationDelay: "450ms" }}
          >
            <button
              onClick={scrollToForm}
              className="group flex items-center gap-2 bg-accent-red text-white font-bold px-8 py-4 rounded-full transition-all duration-300 active:scale-95 uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(255,77,77,0.4),0_0_60px_rgba(255,77,77,0.2)]"
            >
              Get started for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/signup"
              className="flex items-center gap-2 border border-white/20 hover:bg-white/10 text-white font-bold px-8 py-4 rounded-full transition-all uppercase tracking-widest text-sm"
            >
              Create Account
            </Link>
          </div>

          {/* Stats strip */}
          <div
            className="opacity-0 animate-slidein flex flex-wrap items-center justify-center gap-8 md:gap-12 pt-8"
            style={{ animationDelay: "600ms" }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-lg font-display font-bold">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToForm}
          className="absolute bottom-12 animate-bounce text-gray-600 hover:text-gray-400 transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {/* ── How It Works ── */}
      <section
        ref={featuresRef}
        className="py-24 md:py-32 px-6 md:px-12 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center space-y-4 mb-16 transition-all duration-700 ${featuresInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
              }`}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
              How it works
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Three steps to becoming a better presenter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`group relative p-8 border border-white/10 bg-white/[0.03] rounded-2xl space-y-4 transition-all duration-700 hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_0_40px_rgba(255,77,77,0.06)] ${featuresInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
                  }`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                {/* Step number */}
                <span className="absolute top-6 right-6 text-sm text-white font-display font-bold text-4xl">
                  {feature.step}
                </span>
                <div className="w-12 h-12 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center group-hover:bg-accent-red/20 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-accent-red" />
                </div>
                <h3 className="text-xl font-display font-bold">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA after How It Works */}
          <div
            className={`flex justify-center mt-12 transition-all duration-700 ${
              featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <Link
              href="/signup"
              className="group flex items-center gap-2 bg-accent-red text-white font-bold px-8 py-4 rounded-full transition-all duration-300 active:scale-95 uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(255,77,77,0.4),0_0_60px_rgba(255,77,77,0.2)]"
            >
              Sign up for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Score Preview ── */}
      <section
        ref={previewRef}
        className="py-24 md:py-32 px-6 md:px-12 border-t border-white/5"
      >
        <div className="max-w-5xl mx-auto">
          <div
            className={`text-center space-y-4 mb-16 transition-all duration-700 ${previewInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
              }`}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
              See what you get
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Detailed scoring across every dimension of your presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Mock score card */}
            <div
              className={`relative p-8 border border-white/10 bg-white/[0.03] rounded-2xl backdrop-blur-sm transition-all duration-700 ${previewInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
                }`}
              style={{ transitionDelay: "200ms" }}
            >
              {/* Subtle glow behind card */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-accent-red/20 via-transparent to-transparent opacity-50 -z-10 blur-sm" />

              <div className="text-center mb-8">
                <div
                  className={`text-6xl font-display font-bold transition-all duration-1000 ${previewInView ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    }`}
                  style={{ transitionDelay: "400ms" }}
                >
                  <span className="bg-gradient-to-r from-accent-red to-purple-500 bg-clip-text text-transparent">
                    72
                  </span>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                  Overall Score
                </div>
              </div>

              <div className="space-y-3">
                {SCORE_PREVIEW.map((item, i) => (
                  <ScoreBar
                    key={item.name}
                    name={item.name}
                    score={item.score}
                    delay={500 + i * 100}
                    animate={previewInView}
                  />
                ))}
              </div>
            </div>

            {/* Benefits list */}
            <div
              className={`space-y-6 transition-all duration-700 ${previewInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
                }`}
              style={{ transitionDelay: "400ms" }}
            >
              {[
                {
                  title: "Honest, calibrated scoring",
                  desc: "No fake praise. Scores are calibrated so 50-70 is typical and 80+ means genuinely strong.",
                },
                {
                  title: "Evidence with timestamps",
                  desc: "Every piece of feedback points to the exact moment in your recording where it happened.",
                },
                {
                  title: "Actionable improvement plans",
                  desc: "Get specific practice drills and a clear next-step for each dimension you want to improve.",
                },
                {
                  title: "Track your progress",
                  desc: "Record multiple attempts on the same presentation and compare scores side-by-side.",
                },
              ].map((benefit, i) => (
                <div
                  key={benefit.title}
                  className={`flex gap-4 transition-all duration-700 ${previewInView
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-4"
                    }`}
                  style={{ transitionDelay: `${600 + i * 150}ms` }}
                >
                  <div className="mt-1 w-6 h-6 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        ref={pricingRef}
        className="py-24 md:py-32 px-6 md:px-12 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center space-y-4 mb-16 transition-all duration-700 ${
              pricingInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
              Simple pricing
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl backdrop-blur-sm flex flex-col transition-all duration-700 ${
                  plan.highlight
                    ? "border-2 border-accent-red/50 bg-white/[0.03]"
                    : "border border-white/10 bg-white/[0.03]"
                } ${
                  pricingInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      plan.highlight
                        ? "bg-accent-red text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-lg text-gray-400">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{plan.subtitle}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlight ? "text-accent-red" : "text-gray-500"
                        }`}
                      />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link
                    href="/signup"
                    className={`w-full block text-center py-4 rounded-lg font-bold uppercase tracking-widest text-sm transition-all ${
                      plan.highlight
                        ? "bg-accent-red hover:bg-purple-700 text-white hover:shadow-[0_0_30px_rgba(255,77,77,0.3)]"
                        : "border border-white/20 hover:bg-white/10 text-white"
                    }`}
                  >
                    {plan.name === "Free Trial" ? "Start free trial" : "Choose plan"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">
            All prices in AUD. Cancel or change plans anytime.
          </p>
        </div>
      </section>

      {/* ── Sign In ── */}
      <section
        id="signin"
        ref={(el: HTMLDivElement | null) => {
          formRef.current = el;
          (signInRef as { current: HTMLDivElement | null }).current = el;
        }}
        className="py-24 md:py-32 px-6 md:px-12 border-t border-white/5"
      >
        <div className="max-w-md mx-auto">
          <div
            className={`relative transition-all duration-700 ${signInInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
              }`}
          >
            {/* Card glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-accent-red/10 via-transparent to-transparent blur-xl" />

            {/* Glassmorphism card */}
            <div className="relative p-8 border border-white/10 bg-white/[0.03] rounded-2xl backdrop-blur-sm space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-display font-bold">Sign in</h2>
                <p className="text-gray-400">
                  Welcome back. Pick up where you left off.
                </p>
              </div>

              {verified && (
                <p className="text-xs text-green-400 text-center">
                  Email verified successfully. You can now sign in.
                </p>
              )}

              {resetSuccess && (
                <p className="text-xs text-green-400 text-center">
                  Password reset successfully. You can now sign in.
                </p>
              )}

              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                  />
                  <div className="flex justify-end pt-1">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-gray-500 hover:text-accent-red transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full mt-8 group flex items-center justify-center gap-2 bg-accent-red text-white py-4 font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,77,77,0.3)]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-gray-500 uppercase tracking-widest">
                  Or
                </span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-white hover:text-accent-red transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/presx-logo.png"
            alt="PresX"
            width={200}
            height={76}
            className="h-16 md:h-20 lg:h-24 w-auto object-contain opacity-50"
          />
          <div className="flex flex-col md:flex-row items-center gap-4">
            <a
              href="https://www.xolvit.io/get-in-touch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest"
            >
              Contact Us
            </a>
            <a
              href="https://www.xolvit.io/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest"
            >
              Privacy Policy
            </a>
            <p className="text-xs text-gray-600 uppercase tracking-widest">
              Powered by Xolvit
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
