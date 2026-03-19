import {
  ensureSubscription,
  getDailyUsage,
  getCoupon,
  applyCouponToSubscription,
} from "./dynamodb.js";
import type { SubscriptionItem } from "./types.js";

const PLAN_DAILY_LIMITS: Record<string, number> = {
  trial: 5,
  free: 0,
  pro: 15,
  master: 25,
};

export function getEffectiveDailyLimit(sub: SubscriptionItem): number {
  if (sub.dailyLimit != null) return sub.dailyLimit;
  return PLAN_DAILY_LIMITS[sub.plan] ?? 5;
}

export type EffectivePlan = "trial" | "pro" | "master" | "free";

export interface SubscriptionStatus {
  plan: EffectivePlan;
  status: string;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  trialHoursRemaining: number | null;
  dailyAnalysesUsed: number;
  dailyAnalysesLimit: number;
  maxCriteria: number;
  canAnalyze: boolean;
  currentPeriodEnd: string | null;
}

function isTrialExpired(sub: SubscriptionItem): boolean {
  if (sub.plan !== "trial") return false;
  if (!sub.trialEndsAt) return true;
  return new Date(sub.trialEndsAt).getTime() < Date.now();
}

function getTrialTimeRemaining(sub: SubscriptionItem): { days: number; hours: number } | null {
  if (sub.plan !== "trial" || !sub.trialEndsAt) return null;
  const remainingMs = new Date(sub.trialEndsAt).getTime() - Date.now();
  if (remainingMs <= 0) return { days: 0, hours: 0 };
  const totalHours = remainingMs / (60 * 60 * 1000);
  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);
  return { days, hours };
}

export function getEffectivePlan(sub: SubscriptionItem): EffectivePlan {
  if (sub.plan === "trial" && isTrialExpired(sub)) return "free";
  return sub.plan;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const sub = await ensureSubscription(userId);
  const dailyUsed = await getDailyUsage(userId);

  const effectivePlan = getEffectivePlan(sub);
  const effectiveLimit = getEffectiveDailyLimit(sub);

  const isTrial = effectivePlan === "trial";
  const isFree = effectivePlan === "free";

  const dailyLimitReached = dailyUsed >= effectiveLimit;

  let canAnalyze = true;
  if (isFree) canAnalyze = false;
  if (dailyLimitReached) canAnalyze = false;

  const trialTime = isTrial ? getTrialTimeRemaining(sub) : null;

  return {
    plan: effectivePlan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt ?? null,
    trialDaysRemaining: trialTime?.days ?? null,
    trialHoursRemaining: trialTime?.hours ?? null,
    dailyAnalysesUsed: dailyUsed,
    dailyAnalysesLimit: effectiveLimit,
    maxCriteria: -1,
    canAnalyze,
    currentPeriodEnd: sub.currentPeriodEnd ?? null,
  };
}

export type AnalyzeAccessError = "trial_expired" | "daily_limit_reached";

export interface AnalyzeAccessResult {
  error: AnalyzeAccessError | null;
  subscription: SubscriptionItem;
  effectivePlan: EffectivePlan;
  effectiveDailyLimit: number;
}

export async function checkAnalyzeAccess(userId: string): Promise<AnalyzeAccessResult> {
  const subscription = await ensureSubscription(userId);
  const effectivePlan = getEffectivePlan(subscription);
  const effectiveDailyLimit = getEffectiveDailyLimit(subscription);

  if (effectivePlan === "free") {
    return { error: "trial_expired", subscription, effectivePlan, effectiveDailyLimit };
  }

  const dailyUsed = await getDailyUsage(userId);
  if (dailyUsed >= effectiveDailyLimit) {
    return { error: "daily_limit_reached", subscription, effectivePlan, effectiveDailyLimit };
  }

  return { error: null, subscription, effectivePlan, effectiveDailyLimit };
}

export async function applyCoupon(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string; subscription?: SubscriptionStatus }> {
  // Validate coupon exists and is active
  const coupon = await getCoupon(code);
  if (!coupon || !coupon.active) {
    return { success: false, error: "Invalid coupon code" };
  }

  // Check user's current subscription
  const sub = await ensureSubscription(userId);
  const effectivePlan = getEffectivePlan(sub);

  // Reject if user is on a paid plan
  if (effectivePlan === "pro" || effectivePlan === "master") {
    return { success: false, error: "Coupon codes cannot be applied to paid plans" };
  }

  // Apply coupon (atomic condition prevents double-apply)
  try {
    await applyCouponToSubscription(userId, code, coupon.trialDays, coupon.dailyLimit);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "COUPON_ALREADY_USED") {
      return { success: false, error: "You have already used a coupon code" };
    }
    throw err;
  }

  // Return updated subscription status
  const status = await getSubscriptionStatus(userId);
  return { success: true, subscription: status };
}
