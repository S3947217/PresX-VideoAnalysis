"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { createBillingPortalSession } from "@/lib/api";

function UsageMeter({ used, limit }: { used: number; limit: number }) {
  // Cap visual display to avoid rendering too many DOM elements
  const isUnlimited = limit > 100;
  const displayLimit = Math.min(limit, 10);
  const displayUsed = isUnlimited ? Math.min(used, displayLimit) : used;

  if (isUnlimited) {
    return (
      <div className="text-xs text-gray-400">
        {used} used today <span className="text-green-400">(unlimited)</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {Array.from({ length: displayLimit }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full ${i < displayUsed ? "bg-white" : "bg-white/10"
            }`}
        />
      ))}
    </div>
  );
}

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const { url } = await createBillingPortalSession({
        returnUrl: window.location.href,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      Manage
    </button>
  );
}

export default function SubscriptionBanner() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading || !subscription) {
    return (
      <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
        <div className="h-2 bg-white/10 rounded w-full" />
      </div>
    );
  }

  const { plan, trialDaysRemaining, trialHoursRemaining, dailyAnalysesUsed, dailyAnalysesLimit, canAnalyze } = subscription;

  // Trial active
  if (plan === "trial") {
    const days = trialDaysRemaining ?? 0;
    const hours = trialHoursRemaining ?? 0;
    const isUrgent = days === 0;

    let timeLabel: string;
    if (days > 0 && hours > 0) {
      timeLabel = `${days} day${days !== 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""} left`;
    } else if (days > 0) {
      timeLabel = `${days} day${days !== 1 ? "s" : ""} left`;
    } else if (hours > 0) {
      timeLabel = `${hours} hour${hours !== 1 ? "s" : ""} left`;
    } else {
      timeLabel = "Expiring soon";
    }

    return (
      <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-purple-500/50 text-purple-500 rounded-full">
              Free Trial
            </span>
            <span className={`text-sm font-bold ${isUrgent ? "text-red-400" : "text-purple-500"}`}>
              {timeLabel}
            </span>
          </div>
          <Link
            href="/checkout"
            className="text-xs font-bold uppercase tracking-widest text-accent-red hover:text-red-400 transition-colors"
          >
            Subscribe
          </Link>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Analyses today</span>
            <span className="text-white font-bold">{dailyAnalysesUsed}/{dailyAnalysesLimit}</span>
          </div>
          <UsageMeter used={dailyAnalysesUsed} limit={dailyAnalysesLimit} />
        </div>
      </div>
    );
  }

  // Pro or Master active
  if (plan === "pro" || plan === "master") {
    return (
      <div className="border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-green-400/50 text-green-400 rounded-full">
              {plan === "master" ? "Master" : "Pro"}
            </span>
            <span className="text-sm text-gray-400">Active</span>
          </div>
          <ManageSubscriptionButton />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Analyses today</span>
            <span className="text-white font-bold">{dailyAnalysesUsed}/{dailyAnalysesLimit}</span>
          </div>
          <UsageMeter used={dailyAnalysesUsed} limit={dailyAnalysesLimit} />
        </div>
      </div>
    );
  }

  // Free (expired trial) or daily limit hit
  if (plan === "free" || !canAnalyze) {
    const limitHit = dailyAnalysesUsed >= dailyAnalysesLimit;
    return (
      <div className="border border-red-400/30 bg-red-400/5 backdrop-blur-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-red-400/50 text-red-400 rounded-full">
              {limitHit ? "Limit Reached" : "Trial Ended"}
            </span>
            <span className="text-sm text-red-400">
              {limitHit
                ? "Resets tomorrow"
                : "Upgrade to continue"}
            </span>
          </div>
          <Link
            href="/checkout"
            className="bg-accent-red hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
