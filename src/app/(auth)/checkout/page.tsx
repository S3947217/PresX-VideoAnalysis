"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Check, Sparkles, Tag } from "lucide-react";
import { createCheckoutSession, applyCoupon } from "@/lib/api";
import { useSubscription } from "@/context/SubscriptionContext";

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "";
const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID || "";

function FeatureItem({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${muted ? "text-gray-600" : "text-accent-red"}`} />
      <span className={muted ? "text-gray-500" : "text-gray-300"}>{children}</span>
    </li>
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const { subscription, refresh } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "master" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);

  useEffect(() => {
    if (upgraded) refresh();
  }, [upgraded, refresh]);

  const handleCheckout = async (plan: "pro" | "master") => {
    setLoadingPlan(plan);
    setError(null);

    try {
      const priceId = plan === "master" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
      const { url } = await createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/checkout?upgraded=true`,
        cancelUrl: `${window.location.origin}/checkout`,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoadingPlan(null);
    }
  };

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(false);

    try {
      const result = await applyCoupon(couponCode.trim());
      if (result.success) {
        setCouponSuccess(true);
        refresh();
      } else {
        setCouponError(result.error || "Failed to apply coupon");
      }
    } catch {
      setCouponError("Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const currentPlan = subscription?.plan ?? "free";
  const isPaid = currentPlan === "pro" || currentPlan === "master";

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-accent-red/30">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <Image
          src="/presx-logo.png"
          alt="PresX"
          width={320}
          height={96}
          className="h-24 md:h-32 lg:h-36 w-auto object-contain"
          priority
        />
      </nav>

      {/* Success state */}
      {upgraded && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="border border-green-400/30 bg-green-400/5 rounded-2xl p-6 text-center">
            <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h2 className="text-xl font-display font-bold text-green-400 mb-1">Welcome to {currentPlan === "master" ? "Master" : "Pro"}!</h2>
            <p className="text-gray-400 text-sm">Your subscription is now active. Enjoy unlimited criteria per analysis.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto">
          Unlock the full power of presentation coaching.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Free Trial */}
        <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 flex flex-col">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Free Trial</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold">A$0</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">3 days, no card required</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <FeatureItem>5 analyses per day</FeatureItem>
            <FeatureItem>All criteria per analysis</FeatureItem>
            <FeatureItem>Scorecard &amp; detailed feedback</FeatureItem>
            <FeatureItem>Unlimited recordings</FeatureItem>
            <FeatureItem muted>Share &amp; collaborate</FeatureItem>
          </ul>

          <div className="mt-auto">
            {currentPlan === "trial" ? (
              <div className="w-full border border-green-400/30 bg-green-400/5 text-green-400 py-4 rounded-lg font-bold uppercase tracking-widest text-center text-sm">
                Active Now
              </div>
            ) : (
              <div className="w-full border border-white/10 text-gray-500 py-4 rounded-lg font-bold uppercase tracking-widest text-center text-sm">
                {isPaid ? "Included" : "Expired"}
              </div>
            )}
          </div>
        </div>

        {/* Pro (Most Popular) */}
        <div className="border-2 border-accent-red/50 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 flex flex-col relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent-red text-white rounded-full">
            Most Popular
          </span>

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Pro</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold">A$4.99</span>
              <span className="text-lg text-gray-400">/mo</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Billed monthly, cancel anytime</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <FeatureItem>15 analyses per day</FeatureItem>
            <FeatureItem>Unlimited criteria per analysis</FeatureItem>
            <FeatureItem>Scorecard &amp; detailed feedback</FeatureItem>
            <FeatureItem>Unlimited recordings</FeatureItem>
            <FeatureItem>Custom prompting (coming soon)</FeatureItem>
            <FeatureItem muted>Share &amp; collaborate (V2)</FeatureItem>
          </ul>

          {error && loadingPlan === "pro" && (
            <p className="text-sm text-red-400 mb-3">{error}</p>
          )}

          <div className="mt-auto">
            {currentPlan === "pro" ? (
              <div className="w-full border border-green-400/30 text-green-400 py-4 rounded-lg font-bold uppercase tracking-widest text-center text-sm">
                Current Plan
              </div>
            ) : currentPlan === "master" ? (
              <div className="w-full border border-white/10 text-gray-500 py-4 rounded-lg font-bold uppercase tracking-widest text-center text-sm">
                Switch to Monthly
              </div>
            ) : (
              <button
                onClick={() => handleCheckout("pro")}
                disabled={loadingPlan !== null}
                className="w-full bg-accent-red hover:bg-purple-700 text-white py-4 rounded-lg font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPlan === "pro" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {loadingPlan === "pro" ? "Redirecting..." : "Get Pro"}
              </button>
            )}
          </div>
        </div>

        {/* Master (Annual) */}
        <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 flex flex-col relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white rounded-full">
            20% Off
          </span>

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Master</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold">A$3.99</span>
              <span className="text-lg text-gray-400">/mo</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">A$47.88 billed annually</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <FeatureItem>25 analyses per day</FeatureItem>
            <FeatureItem>Unlimited criteria per analysis</FeatureItem>
            <FeatureItem>Scorecard &amp; detailed feedback</FeatureItem>
            <FeatureItem>Unlimited recordings</FeatureItem>
            <FeatureItem>Custom prompting (coming soon)</FeatureItem>
            <FeatureItem muted>Share &amp; collaborate (V2)</FeatureItem>
          </ul>

          {error && loadingPlan === "master" && (
            <p className="text-sm text-red-400 mb-3">{error}</p>
          )}

          <div className="mt-auto">
            {currentPlan === "master" ? (
              <div className="w-full border border-green-400/30 text-green-400 py-4 rounded-lg font-bold uppercase tracking-widest text-center text-sm">
                Current Plan
              </div>
            ) : currentPlan === "pro" ? (
              <button
                onClick={() => handleCheckout("master")}
                disabled={loadingPlan !== null}
                className="w-full border border-white/20 hover:bg-white/10 text-white py-4 rounded-lg font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPlan === "master" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {loadingPlan === "master" ? "Redirecting..." : "Switch to Annual"}
              </button>
            ) : (
              <button
                onClick={() => handleCheckout("master")}
                disabled={loadingPlan !== null}
                className="w-full border border-white/20 hover:bg-white/10 text-white py-4 rounded-lg font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPlan === "master" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {loadingPlan === "master" ? "Redirecting..." : "Get Master"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coupon section */}
      {!isPaid && (
        <div className="max-w-md mx-auto mt-10">
          {!showCoupon ? (
            <button
              onClick={() => setShowCoupon(true)}
              className="w-full text-center text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Have a coupon code?
            </button>
          ) : (
            <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 space-y-4">
              <p className="text-sm text-gray-400 text-center">Enter your coupon code</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCoupon()}
                  placeholder="Coupon code"
                  disabled={couponLoading || couponSuccess}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-red/50 disabled:opacity-50"
                />
                <button
                  onClick={handleCoupon}
                  disabled={couponLoading || couponSuccess || !couponCode.trim()}
                  className="px-6 py-3 bg-accent-red hover:bg-purple-700 text-white rounded-lg text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {couponLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {couponLoading ? "Applying..." : "Apply"}
                </button>
              </div>
              {couponError && (
                <p className="text-sm text-red-400 text-center">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="text-sm text-green-400 text-center">Coupon applied! Your trial has been activated.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer note */}
      <div className="max-w-6xl mx-auto text-center mt-12">
        <p className="text-xs text-gray-600">
          Payments processed securely by Stripe. All prices in AUD. Cancel or change plans anytime.
        </p>
      </div>
    </main>
  );
}
