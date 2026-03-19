import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { ProjectItem, SubscriptionItem, CouponItem, AnalysisJobItem, JobStatus, AnalysisResult } from "./types.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME!;
const COUPONS_TABLE_NAME = process.env.COUPONS_TABLE_NAME!;

export function userPK(userId: string): string {
  return `USER#${userId}`;
}

export function projectSK(projectId: string): string {
  return `PROJECT#${projectId}`;
}

export async function getProjectItem(
  userId: string,
  projectId: string
): Promise<ProjectItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(userId), SK: projectSK(projectId) },
    })
  );
  return (result.Item as ProjectItem) ?? null;
}

export async function putProjectItem(item: ProjectItem): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

export async function deleteProjectItem(
  userId: string,
  projectId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(userId), SK: projectSK(projectId) },
    })
  );
}

export async function queryUserProjects(
  userId: string
): Promise<ProjectItem[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": userPK(userId),
        ":skPrefix": "PROJECT#",
      },
    })
  );
  return (result.Items as ProjectItem[]) ?? [];
}

export async function getSubscription(userId: string): Promise<SubscriptionItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(userId), SK: "SUBSCRIPTION" },
    })
  );
  return (result.Item as SubscriptionItem) ?? null;
}

export async function putSubscription(item: SubscriptionItem): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

export async function setStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(userId), SK: "SUBSCRIPTION" },
      UpdateExpression: "SET stripeCustomerId = :cid",
      ExpressionAttributeValues: { ":cid": customerId },
    })
  );
}

export async function getDailyUsage(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(userId), SK: `USAGE#${today}` },
    })
  );
  return (result.Item as { analysisCount?: number } | undefined)?.analysisCount ?? 0;
}

export async function incrementDailyUsage(userId: string, limit: number): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: userPK(userId), SK: `USAGE#${today}` },
        UpdateExpression: "SET analysisCount = if_not_exists(analysisCount, :zero) + :one, #t = :ttl",
        ConditionExpression: "attribute_not_exists(analysisCount) OR analysisCount < :limit",
        ExpressionAttributeNames: { "#t": "ttl" },
        ExpressionAttributeValues: {
          ":zero": 0,
          ":one": 1,
          ":limit": limit,
          ":ttl": ttl,
        },
      })
    );
    return true;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "name" in err && err.name === "ConditionalCheckFailedException") {
      return false;
    }
    throw err;
  }
}

export async function ensureSubscription(userId: string): Promise<SubscriptionItem> {
  const existing = await getSubscription(userId);
  if (existing) return existing;

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const item: SubscriptionItem = {
    PK: userPK(userId),
    SK: "SUBSCRIPTION",
    plan: "trial",
    status: "active",
    trialEndsAt: trialEnd.toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "name" in err && err.name === "ConditionalCheckFailedException") {
      const reFetched = await getSubscription(userId);
      if (reFetched) return reFetched;
    }
    throw err;
  }

  return item;
}

export async function getCoupon(code: string): Promise<CouponItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: COUPONS_TABLE_NAME,
      Key: { code },
    })
  );
  return (result.Item as CouponItem) ?? null;
}

// ── Job CRUD ──

export function jobSK(jobId: string): string {
  return `JOB#${jobId}`;
}

export async function putJobItem(item: AnalysisJobItem): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

export async function getJobItem(
  userId: string,
  jobId: string
): Promise<AnalysisJobItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(userId), SK: jobSK(jobId) },
    })
  );
  return (result.Item as AnalysisJobItem) ?? null;
}

export async function updateJobStatus(
  userId: string,
  jobId: string,
  status: JobStatus,
  result?: AnalysisResult,
  error?: string
): Promise<void> {
  let updateExpr = "SET #st = :status";
  const names: Record<string, string> = { "#st": "status" };
  const values: Record<string, unknown> = { ":status": status };

  if (result !== undefined) {
    updateExpr += ", #res = :result";
    names["#res"] = "result";
    values[":result"] = result;
  }
  if (error !== undefined) {
    updateExpr += ", #err = :error";
    names["#err"] = "error";
    values[":error"] = error;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(userId), SK: jobSK(jobId) },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

export async function applyCouponToSubscription(
  userId: string,
  couponCode: string,
  trialDays: number,
  dailyLimit: number
): Promise<SubscriptionItem> {
  const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: userPK(userId), SK: "SUBSCRIPTION" },
        UpdateExpression:
          "SET #plan = :plan, #status = :status, trialEndsAt = :trialEnd, dailyLimit = :dailyLimit, couponCode = :couponCode",
        ConditionExpression: "attribute_not_exists(couponCode)",
        ExpressionAttributeNames: {
          "#plan": "plan",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":plan": "trial",
          ":status": "active",
          ":trialEnd": trialEnd.toISOString(),
          ":dailyLimit": dailyLimit,
          ":couponCode": couponCode,
        },
      })
    );
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "ConditionalCheckFailedException"
    ) {
      throw new Error("COUPON_ALREADY_USED");
    }
    throw err;
  }

  const updated = await getSubscription(userId);
  return updated!;
}
