import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from "./projects.js";
import { generatePresignedUrl, getAudioPlaybackUrl } from "./presign.js";
import { submitAnalysis, processAnalysis, getAnalysisJob } from "./analyze.js";
import { createCheckout, createBillingPortal, handleWebhook } from "./stripe.js";
import { getSubscriptionStatus, applyCoupon } from "./subscription.js";
import { notifySignup } from "./notify.js";

function getUserId(event: APIGatewayProxyEventV2): string | null {
  const jwtEvent = event as APIGatewayProxyEventV2WithJWTAuthorizer;
  return (
    jwtEvent.requestContext?.authorizer?.jwt?.claims?.sub as string | undefined
  ) ?? null;
}

function pathParam(event: APIGatewayProxyEventV2, name: string): string | undefined {
  return event.pathParameters?.[name];
}

export async function handler(
  event: APIGatewayProxyEventV2 & { asyncAction?: string; userId?: string; jobId?: string }
): Promise<APIGatewayProxyResultV2 | void> {
  // Async dispatch: self-invoked via InvokeCommand({ InvocationType: "Event" })
  if (event.asyncAction === "processAnalysis") {
    await processAnalysis(event.userId!, event.jobId!);
    return;
  }

  const routeKey = event.routeKey;

  try {
    // Unauthenticated routes
    if (routeKey === "POST /webhook") {
      return handleWebhook(event);
    }

    if (routeKey === "GET /public/projects") {
      const userId = event.queryStringParameters?.userId;
      const projectId = event.queryStringParameters?.projectId;
      if (!userId || !projectId) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "userId and projectId are required" }),
        };
      }
      return getProject(userId, projectId);
    }

    // All other routes require auth
    const userId = getUserId(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    switch (routeKey) {
      case "GET /projects":
        return listProjects(userId);
      case "POST /projects":
        return createProject(userId, event);
      case "GET /projects/{id}":
        return getProject(userId, pathParam(event, "id")!);
      case "PUT /projects/{id}":
        return updateProject(userId, pathParam(event, "id")!, event);
      case "DELETE /projects/{id}":
        return deleteProject(userId, pathParam(event, "id")!);
      case "POST /presign":
        return generatePresignedUrl(userId, event);
      case "POST /analyze":
        return submitAnalysis(userId, event);
      case "GET /analyze/{jobId}":
        return getAnalysisJob(userId, pathParam(event, "jobId")!);
      case "GET /audio-url/{proxy+}":
        return getAudioPlaybackUrl(userId, pathParam(event, "proxy")!);
      case "POST /checkout":
        return createCheckout(userId, event);
      case "POST /billing-portal":
        return createBillingPortal(userId, event);
      case "GET /subscription": {
        const status = await getSubscriptionStatus(userId);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(status),
        };
      }
      case "POST /coupon": {
        const couponBody = JSON.parse(event.body || "{}");
        const code = couponBody.code;
        if (!code || typeof code !== "string" || code.length > 100) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: false, error: "Invalid coupon code" }),
          };
        }
        const result = await applyCoupon(userId, code.trim());
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        };
      }
      case "POST /notify-signup":
        return notifySignup(event);
      default:
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Not found" }),
        };
    }
  } catch (error: unknown) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}
