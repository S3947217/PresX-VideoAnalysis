"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coffee, Check, Sparkles, Clock } from "lucide-react";

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-12 bg-black text-white selection:bg-accent-red/30 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_30%,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-accent-red/10 blur-[120px] animate-float-1" />
      <div className="absolute bottom-1/4 -left-32 w-[350px] h-[350px] rounded-full bg-indigo-500/8 blur-[100px] animate-float-2" />

      <div className="relative z-10 w-full max-w-4xl text-center space-y-10">
        {/* Logo */}
        <div className="opacity-0 animate-slidein" style={{ animationDelay: "0ms" }}>
          <Image
            src="/presx-logo.png"
            alt="PresX"
            width={240}
            height={90}
            className="h-20 md:h-28 w-auto object-contain mx-auto"
            priority
          />
        </div>

        {/* Celebration icon */}
        <div className="opacity-0 animate-slidein" style={{ animationDelay: "150ms" }}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-red/10 border border-accent-red/20 mx-auto">
            <Sparkles className="w-9 h-9 text-accent-red" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4 opacity-0 animate-slidein" style={{ animationDelay: "300ms" }}>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            Welcome to PresX!
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Your <span className="text-white font-semibold">3-day free trial</span> has started.
          </p>
        </div>

        {/* Trial info card */}
        <div
          className="relative opacity-0 animate-slidein"
          style={{ animationDelay: "450ms" }}
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-accent-red/10 via-transparent to-transparent blur-xl" />
          <div className="relative border border-white/10 bg-white/[0.03] rounded-2xl backdrop-blur-sm p-8 space-y-6">
            <div className="flex items-center gap-3 justify-center">
              <Clock className="w-5 h-5 text-accent-red" />
              <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
                What you get for free
              </span>
            </div>

            <ul className="space-y-3 text-left max-w-xs mx-auto">
              <li className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">5 analyses per day</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">Scoring across 6 dimensions</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">Detailed feedback with timestamps</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">Unlimited recordings &amp; uploads</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Premium upsell heading */}
        <div
          className="opacity-0 animate-slidein space-y-2 pt-4"
          style={{ animationDelay: "600ms" }}
        >
          <div className="flex items-center justify-center gap-3">
            <Coffee className="w-6 h-6 text-accent-red" />
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Get premium for the price of a coffee
            </h2>
          </div>
          <p className="text-gray-400 text-base">
            Unlock the full power of presentation coaching.
          </p>
        </div>

        {/* Plan cards */}
        <div
          className="opacity-0 animate-slidein grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ animationDelay: "750ms" }}
        >
          {/* Free Trial */}
          <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 flex flex-col text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Free Trial</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-display font-bold">A$0</span>
            </div>
            <p className="text-xs text-gray-500 mb-5">3 days, no card required</p>
            <ul className="space-y-2.5 flex-1">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">5 analyses per day</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">All criteria per analysis</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">Scorecard &amp; feedback</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">Unlimited recordings</span>
              </li>
            </ul>
            <div className="mt-6 w-full border border-green-400/30 bg-green-400/5 text-green-400 py-3 rounded-lg font-bold uppercase tracking-widest text-center text-xs">
              Active Now
            </div>
          </div>

          {/* Pro */}
          <div className="border-2 border-accent-red/50 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 flex flex-col text-left relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent-red text-white rounded-full">
              Most Popular
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Pro</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-display font-bold">A$4.99</span>
              <span className="text-base text-gray-400">/mo</span>
            </div>
            <p className="text-xs text-gray-500 mb-5">Billed monthly, cancel anytime</p>
            <ul className="space-y-2.5 flex-1">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">15 analyses per day</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">Unlimited criteria</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">Scorecard &amp; feedback</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-300">Unlimited recordings</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent-red" />
                <span className="text-gray-400">Custom prompting (coming soon)</span>
              </li>
            </ul>
            <Link
              href="/checkout"
              className="mt-6 w-full block text-center bg-accent-red hover:bg-purple-700 text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Get Pro
            </Link>
          </div>

          {/* Master */}
          <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 flex flex-col text-left relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white rounded-full">
              20% Off
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Master</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-display font-bold">A$3.99</span>
              <span className="text-base text-gray-400">/mo</span>
            </div>
            <p className="text-xs text-gray-500 mb-5">A$47.88 billed annually</p>
            <ul className="space-y-2.5 flex-1">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">25 analyses per day</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">Unlimited criteria</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">Scorecard &amp; feedback</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-300">Unlimited recordings</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="text-gray-400">Custom prompting (coming soon)</span>
              </li>
            </ul>
            <Link
              href="/checkout"
              className="mt-6 w-full block text-center border border-white/20 hover:bg-white/10 text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Get Master
            </Link>
          </div>
        </div>

        <p
          className="opacity-0 animate-slidein text-xs text-gray-600"
          style={{ animationDelay: "850ms" }}
        >
          All prices in AUD. Cancel or change plans anytime.
        </p>

        {/* CTA */}
        <div
          className="opacity-0 animate-slidein flex flex-col items-center gap-4"
          style={{ animationDelay: "900ms" }}
        >
          <Link
            href="/"
            className="group flex items-center gap-2 bg-accent-red hover:bg-purple-700 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 active:scale-95 uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(255,77,77,0.4)]"
          >
            Start practicing
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </main>
  );
}
