"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, Smartphone, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const APP_STORE_URL =
  "https://apps.apple.com/au/app/xolvit/id1616051961";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.xolvit.android&hl=en_AU";

const HERO_WORDS = ["presentations", "confidence", "delivery", "career"];

type Step = "email" | "password";

/* ─── Typewriter ─── */

function TypewriterWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = HERO_WORDS[wordIndex];

    if (!isDeleting && text === current) {
      const pause = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(pause);
    }

    if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
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
  }, [text, isDeleting, wordIndex]);

  return (
    <span className="inline-block">
      <span className="bg-gradient-to-r from-accent-red via-purple-500 to-accent-red bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
        {text}
      </span>
      <span className="inline-block w-[2px] md:w-[3px] h-[0.85em] bg-accent-red ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

/* ─── Page ─── */

export default function SignupPage() {
  const router = useRouter();
  const { signUp, setPendingPassword } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1 — check email against Adalo
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to verify email");
        return;
      }

      if (!data.exists) {
        setNotFound(true);
        return;
      }

      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setStep("password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — create Cognito account
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim().toLowerCase(), password, email.trim().toLowerCase());
      setPendingPassword(password);
      const params = new URLSearchParams({ email: email.trim().toLowerCase() });
      if (firstName) params.set("firstName", firstName);
      if (lastName) params.set("lastName", lastName);
      router.push(`/verify?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-8 pt-40 pb-8 md:px-24 md:pt-48 md:pb-24 bg-black text-white selection:bg-accent-red/30 overflow-hidden">
      {/* Background: Grid pattern */}
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_30%,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Background: Gradient orbs */}
      <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-accent-red/10 blur-[120px] animate-float-1" />
      <div className="absolute bottom-1/4 -left-32 w-[350px] h-[350px] rounded-full bg-indigo-500/8 blur-[100px] animate-float-2" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link href="/login">
            <Image
              src="/presx-logo.png"
              alt="PresX"
              width={240}
              height={90}
              className="h-20 md:h-28 lg:h-32 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login#signin"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Hero heading */}
        <div
          className="text-center mb-12 opacity-0 animate-slidein"
          style={{ animationDelay: "0ms" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-widest text-gray-400 mb-6">
            <Zap className="w-3 h-3 text-accent-red" />
            Join PresX
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight tracking-tight">
            Level up your{" "}
            <TypewriterWord />.
          </h1>
          <p className="text-gray-400 mt-3 text-sm md:text-base">
            Create your free account and start improving today.
          </p>
        </div>

        {/* Steps Indicator */}
        <div
          className="flex items-center justify-center gap-4 mb-10 text-sm font-medium uppercase tracking-widest text-gray-500 opacity-0 animate-slidein"
          style={{ animationDelay: "150ms" }}
        >
          <span
            className={`flex items-center gap-2 transition-colors ${step === "email" ? "text-white" : "text-gray-600"
              }`}
          >
            <span
              className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center font-bold transition-all ${step === "email"
                ? "border-accent-red bg-accent-red/10 text-accent-red"
                : "border-gray-700 text-gray-600"
                }`}
            >
              1
            </span>
            Verify
          </span>
          <div className="w-8 h-px bg-gray-800" />
          <span
            className={`flex items-center gap-2 transition-colors ${step === "password" ? "text-white" : "text-gray-600"
              }`}
          >
            <span
              className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center font-bold transition-all ${step === "password"
                ? "border-accent-red bg-accent-red/10 text-accent-red"
                : "border-gray-700 text-gray-600"
                }`}
            >
              2
            </span>
            Password
          </span>
        </div>

        {/* Glassmorphism card */}
        <div
          className="relative opacity-0 animate-slidein"
          style={{ animationDelay: "300ms" }}
        >
          {/* Card glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-accent-red/10 via-transparent to-transparent blur-xl" />

          <div className="relative border border-white/10 bg-white/[0.03] rounded-2xl backdrop-blur-sm p-8">
            {step === "email" ? (
              <div className="space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-display font-bold">
                    Verify Your Email
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Enter the email you used to sign up on the Xolvit app
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-400 text-center">{error}</p>
                )}

                {notFound && (
                  <div className="p-5 border border-white/10 bg-white/[0.03] rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-5 h-5 text-accent-red" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Sign up on the Xolvit app first
                        </p>
                        <p className="text-xs text-gray-400">
                          This email isn&apos;t registered yet. Download the app
                          and create your account.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={APP_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white text-xs font-bold py-2.5 px-4 rounded-full transition-all active:scale-95 uppercase tracking-widest"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        App Store
                      </a>
                      <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white text-xs font-bold py-2.5 px-4 rounded-full transition-all active:scale-95 uppercase tracking-widest"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.627L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                        </svg>
                        Google Play
                      </a>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCheckEmail} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (notFound) setNotFound(false);
                      }}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full mt-4 group flex items-center justify-center gap-2 bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Verify Email
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
                  Already have an account?{" "}
                  <Link
                    href="/login#signin"
                    className="text-white hover:text-accent-red transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-display font-bold">
                    Set Your Password
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Welcome,{" "}
                    <span className="text-white">{email}</span>
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-400 text-center">{error}</p>
                )}

                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      Email
                    </label>
                    <div className="w-full border-b border-gray-800 py-3 text-lg text-gray-500">
                      {email}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters, upper + lower + number"
                      required
                      autoFocus
                      className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full mt-4 group flex items-center justify-center gap-2 bg-accent-red text-white py-4 font-bold uppercase tracking-widest hover:bg-purple-700 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(94,23,235,0.3)]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
