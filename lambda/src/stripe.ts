import type { APIGatewayProxyEventV2 } from "aws-lambda";
import Stripe from "stripe";
import { getSecret } from "./secrets.js";
import {
  putSubscription,
  setStripeCustomerId,
  ensureSubscription,
  getSubscription,
  userPK,
} from "./dynamodb.js";

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// Allowed redirect domains for checkout success/cancel URLs
const ALLOWED_REDIRECT_HOSTS = new Set([
  "localhost",
  "presx.tech",
  "www.presx.tech",
]);

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (ALLOWED_REDIRECT_HOSTS.has(parsed.hostname)) return true;
    // Allow App Runner default URLs
    if (parsed.hostname.endsWith(".awsapprunner.com")) return true;
    return false;
  } catch {
    return false;
  }
}

async function getStripe(): Promise<Stripe> {
  const key = await getSecret("STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export async function createCheckout(
  userId: string,
  event: APIGatewayProxyEventV2
) {
  const body = JSON.parse(event.body || "{}");
  const { priceId, successUrl, cancelUrl } = body;

  if (!priceId || !successUrl || !cancelUrl) {
    return json(400, {
      error: "priceId, successUrl, and cancelUrl are required",
    });
  }

  // Validate redirect URLs point to allowed domains
  if (!isAllowedRedirectUrl(successUrl) || !isAllowedRedirectUrl(cancelUrl)) {
    return json(400, { error: "Invalid redirect URL" });
  }

  // Validate priceId format (Stripe price IDs start with "price_")
  if (typeof priceId !== "string" || !priceId.startsWith("price_") || priceId.length > 100) {
    return json(400, { error: "Invalid priceId" });
  }

  const stripe = await getStripe();

  // Ensure subscription exists (creates trial if first visit)
  const sub = await ensureSubscription(userId);
  let customerId = sub.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { cognitoSub: userId },
    });
    customerId = customer.id;

    // Only set the Stripe customer ID — preserve existing plan/trial fields
    await setStripeCustomerId(userId, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { cognitoSub: userId },
    subscription_data: { metadata: { cognitoSub: userId } },
  });

  return json(200, { sessionId: session.id, url: session.url });
}

export async function createBillingPortal(
  userId: string,
  event: APIGatewayProxyEventV2
) {
  const body = JSON.parse(event.body || "{}");
  const { returnUrl } = body;

  if (!returnUrl) {
    return json(400, { error: "returnUrl is required" });
  }

  if (!isAllowedRedirectUrl(returnUrl)) {
    return json(400, { error: "Invalid return URL" });
  }

  const sub = await getSubscription(userId);

  if (!sub?.stripeCustomerId) {
    return json(400, { error: "No active subscription found" });
  }

  const stripe = await getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  });

  return json(200, { url: session.url });
}

export async function handleWebhook(event: APIGatewayProxyEventV2) {
  const signature = event.headers["stripe-signature"];
  if (!signature) {
    return json(400, { error: "Missing stripe-signature header" });
  }

  const stripe = await getStripe();
  const webhookSecret = await getSecret("STRIPE_WEBHOOK_SECRET");

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf-8")
    : event.body || "";

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return json(400, { error: "Invalid signature" });
  }

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const cognitoSub = session.metadata?.cognitoSub;
      if (cognitoSub && session.subscription) {
        // Determine plan from subscription interval
        const stripeSub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const interval = stripeSub.items.data[0]?.price?.recurring?.interval;
        const plan = interval === "year" ? "master" : "pro";

        // Preserve coupon fields from existing subscription
        const existing = await getSubscription(cognitoSub);

        await putSubscription({
          PK: userPK(cognitoSub),
          SK: "SUBSCRIPTION",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          plan,
          status: "active",
          currentPeriodEnd: new Date(
            stripeSub.current_period_end * 1000
          ).toISOString(),
          ...(existing?.couponCode && { couponCode: existing.couponCode }),
          ...(existing?.dailyLimit != null && { dailyLimit: existing.dailyLimit }),
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const cognitoSub = subscription.metadata?.cognitoSub;
      if (cognitoSub) {
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        let plan: "free" | "pro" | "master" = "free";
        if (isActive) {
          const interval = subscription.items.data[0]?.price?.recurring?.interval;
          plan = interval === "year" ? "master" : "pro";
        }

        // Preserve coupon fields from existing subscription
        const existingSub = await getSubscription(cognitoSub);

        await putSubscription({
          PK: userPK(cognitoSub),
          SK: "SUBSCRIPTION",
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          plan,
          status: subscription.status,
          currentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          ...(existingSub?.couponCode && { couponCode: existingSub.couponCode }),
          ...(existingSub?.dailyLimit != null && { dailyLimit: existingSub.dailyLimit }),
        });
      }
      break;
    }
  }

  return json(200, { received: true });
}
