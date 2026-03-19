"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — send reset code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code");
        return;
      }

      setStep("reset");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — reset password
  const handleResetPassword = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
          newPassword: password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      router.push("/login?reset=success#signin");
    } catch {
      setError("Something went wrong. Please try again.");
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
            <KeyRound className="w-3 h-3 text-accent-red" />
            Reset Password
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-gray-400 mt-3 text-sm md:text-base">
            {step === "email"
              ? "Enter your email and we'll send you a reset code."
              : "Check your email for the 6-digit code."}
          </p>
        </div>

        {/* Steps Indicator */}
        <div
          className="flex items-center justify-center gap-4 mb-10 text-sm font-medium uppercase tracking-widest text-gray-500 opacity-0 animate-slidein"
          style={{ animationDelay: "150ms" }}
        >
          <span
            className={`flex items-center gap-2 transition-colors ${
              step === "email" ? "text-white" : "text-gray-600"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center font-bold transition-all ${
                step === "email"
                  ? "border-accent-red bg-accent-red/10 text-accent-red"
                  : "border-gray-700 text-gray-600"
              }`}
            >
              1
            </span>
            Email
          </span>
          <div className="w-8 h-px bg-gray-800" />
          <span
            className={`flex items-center gap-2 transition-colors ${
              step === "reset" ? "text-white" : "text-gray-600"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center font-bold transition-all ${
                step === "reset"
                  ? "border-accent-red bg-accent-red/10 text-accent-red"
                  : "border-gray-700 text-gray-600"
              }`}
            >
              2
            </span>
            Reset
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
                    Enter Your Email
                  </h2>
                  <p className="text-gray-400 text-sm">
                    We&apos;ll send a verification code to reset your password
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-400 text-center">{error}</p>
                )}

                <form onSubmit={handleSendCode} className="space-y-6">
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
                      autoFocus
                      className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full mt-4 group flex items-center justify-center gap-2 bg-accent-red text-white py-4 font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,77,77,0.3)]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Send Reset Code
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
                  Remember your password?{" "}
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
                    setCode("");
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
                    Reset Your Password
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Code sent to{" "}
                    <span className="text-white">{email}</span>
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-400 text-center">{error}</p>
                )}

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="6-digit code"
                      required
                      autoFocus
                      maxLength={6}
                      className="w-full bg-transparent border-b border-gray-800 py-3 text-lg focus:border-white focus:outline-none transition-colors placeholder:text-gray-800 tracking-[0.3em]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters, upper + lower + number"
                      required
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
                    disabled={loading || !code || !password || !confirmPassword}
                    className="w-full mt-4 group flex items-center justify-center gap-2 bg-accent-red text-white py-4 font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,77,77,0.3)]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Reset Password
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
