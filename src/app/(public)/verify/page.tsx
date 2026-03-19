"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CheckCircle2, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmSignUp, signIn, pendingPassword, setPendingPassword } = useAuth();

  const emailParam = searchParams.get("email") || "";
  const firstNameParam = searchParams.get("firstName") || "";
  const lastNameParam = searchParams.get("lastName") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await confirmSignUp(emailParam, code.trim());

      // Auto-sign-in if password was held in memory from signup flow
      if (pendingPassword) {
        const pw = pendingPassword;
        setPendingPassword(null);
        await signIn(emailParam, pw);
        // Fire-and-forget signup notification + welcome email
        fetch("/api/proxy/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailParam, firstName: firstNameParam, lastName: lastNameParam }),
        }).catch(() => {});
        router.replace("/welcome");
      } else {
        router.push("/login?verified=true#signin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);
    setResent(false);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResent(true);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-8 md:p-24 bg-black text-white selection:bg-accent-red/30 overflow-hidden">
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
      <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-accent-red/10 blur-[120px] animate-float-1" />
      <div className="absolute bottom-1/3 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-500/8 blur-[100px] animate-float-2" />

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
        {/* Icon + heading */}
        <div
          className="text-center mb-10 opacity-0 animate-slidein"
          style={{ animationDelay: "0ms" }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red/20 mb-6">
            <Mail className="w-7 h-7 text-accent-red" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Check your inbox
          </h1>
          <p className="text-gray-400 mt-3 text-sm md:text-base">
            We sent a 6-digit code to{" "}
            <span className="text-white font-medium">{emailParam}</span>
          </p>
          <p className="text-gray-500 mt-2 text-xs">
            Your free trial starts after verification
          </p>
        </div>

        {/* Glassmorphism card */}
        <div
          className="relative opacity-0 animate-slidein"
          style={{ animationDelay: "200ms" }}
        >
          {/* Card glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-accent-red/10 via-transparent to-transparent blur-xl" />

          <div className="relative border border-white/10 bg-white/[0.03] rounded-2xl backdrop-blur-sm p-8 space-y-8">
            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            {resent && (
              <p className="text-xs text-green-400 text-center">
                Verification code resent.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full bg-transparent border-b border-gray-800 py-3 text-3xl text-center tracking-[0.5em] font-display font-bold focus:border-white focus:outline-none transition-colors placeholder:text-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full mt-4 group flex items-center justify-center gap-2 bg-accent-red text-white py-4 font-bold uppercase tracking-widest hover:bg-purple-700 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(94,23,235,0.3)]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify
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

            <div className="text-center space-y-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-gray-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend verification code"}
              </button>

              <p className="text-sm text-gray-500">
                Wrong email?{" "}
                <Link
                  href="/signup"
                  className="text-white hover:text-accent-red transition-colors"
                >
                  Go back
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
