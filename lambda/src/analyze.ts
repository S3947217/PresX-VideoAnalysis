import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { getSecret } from "./secrets.js";
import {
  getProjectItem,
  putProjectItem,
  putJobItem,
  getJobItem,
  updateJobStatus,
  incrementDailyUsage,
  userPK,
  jobSK,
} from "./dynamodb.js";
import { checkAnalyzeAccess } from "./subscription.js";
import {
  CRITERIA_KEYS,
  type CriterionKey,
  type AnalysisResult,
  type AnalysisRun,
  type AnalysisJobItem,
} from "./types.js";

const s3 = new S3Client({});
const lambda = new LambdaClient({});
const BUCKET_NAME = process.env.BUCKET_NAME!;
const FUNCTION_NAME = process.env.AWS_LAMBDA_FUNCTION_NAME!;

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function normalizeCriteria(criteria: unknown): CriterionKey[] {
  const criteriaSet = new Set(CRITERIA_KEYS);
  if (Array.isArray(criteria) && criteria.length > 0) {
    const filtered = criteria.filter((c: string) =>
      criteriaSet.has(c as CriterionKey)
    ) as CriterionKey[];
    if (filtered.length > 0) return filtered;
  }
  return [...CRITERIA_KEYS];
}

function buildSystemPrompt(
  purpose: string,
  audience: string,
  topic: string,
  selectedCriteria: CriterionKey[]
): string {
  // TODO: Build your analysis prompt here.
  // This function should return a system prompt string that instructs the AI
  // to evaluate the presentation based on the given criteria.
  //
  // Available criteria keys: fluency, pacing, clarity, structureAndFlow, engagement, vocabularyEffectiveness
  //
  // The prompt should instruct the AI to return JSON matching the AnalysisResult type (see types.ts)
  //
  // Context variables available:
  //   - purpose: why the user is presenting (e.g. "university assignment")
  //   - audience: who they're presenting to (e.g. "classmates and professor")
  //   - topic: the presentation topic (may be empty)
  //   - selectedCriteria: which criteria to evaluate
  //
  throw new Error("Not implemented — build your system prompt");
}

// ── submitAnalysis: fast path, returns { jobId } ──

export async function submitAnalysis(
  userId: string,
  event: APIGatewayProxyEventV2
) {
  const body = JSON.parse(event.body || "{}");
  const { s3Key, purpose, audience, topic, criteria, projectId } = body;

  if (!s3Key || typeof s3Key !== "string" || s3Key.length > 500) {
    return json(400, { error: "s3Key is required and must be under 500 characters" });
  }
  if (purpose && (typeof purpose !== "string" || purpose.length > 500)) {
    return json(400, { error: "purpose must be under 500 characters" });
  }
  if (audience && (typeof audience !== "string" || audience.length > 200)) {
    return json(400, { error: "audience must be under 200 characters" });
  }
  if (topic && (typeof topic !== "string" || topic.length > 500)) {
    return json(400, { error: "topic must be under 500 characters" });
  }

  const expectedPrefix = `audio/${userId}/`;
  if (!s3Key.startsWith(expectedPrefix)) {
    return json(403, { error: "Access denied to this audio file" });
  }

  // Check subscription access
  const access = await checkAnalyzeAccess(userId);
  if (access.error === "trial_expired") {
    return json(403, { error: "trial_expired", message: "Your free trial has ended. Upgrade to continue analysing." });
  }
  if (access.error === "daily_limit_reached") {
    return json(429, { error: "daily_limit_reached", message: "Daily analysis limit reached. Try again tomorrow." });
  }

  // Atomically increment usage before dispatching async work
  const incremented = await incrementDailyUsage(userId, access.effectiveDailyLimit);
  if (!incremented) {
    return json(429, { error: "daily_limit_reached", message: "Daily analysis limit reached. Try again tomorrow." });
  }

  const selectedCriteria = normalizeCriteria(criteria);

  // Create JOB item
  const jobId = uuidv4();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h

  const jobItem: AnalysisJobItem = {
    PK: userPK(userId),
    SK: jobSK(jobId),
    jobId,
    status: "pending",
    payload: {
      s3Key,
      purpose: purpose || "General Presentation",
      audience: audience || "General Audience",
      topic: typeof topic === "string" ? topic.trim() : "",
      criteria: selectedCriteria,
      projectId,
    },
    createdAt: now,
    ttl,
  };

  await putJobItem(jobItem);

  // Invoke self async (fire-and-forget)
  await lambda.send(
    new InvokeCommand({
      FunctionName: FUNCTION_NAME,
      InvocationType: "Event",
      Payload: Buffer.from(
        JSON.stringify({
          asyncAction: "processAnalysis",
          userId,
          jobId,
        })
      ),
    })
  );

  return json(202, { jobId });
}

// ── processAnalysis: async worker (invoked via Event) ──

export async function processAnalysis(userId: string, jobId: string) {
  await updateJobStatus(userId, jobId, "processing");

  try {
    const job = await getJobItem(userId, jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const { s3Key, purpose, audience, topic, criteria, projectId } = job.payload;
    const selectedCriteria = criteria;

    // Read audio from S3
    const s3Response = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })
    );
    const audioBytes = await s3Response.Body!.transformToByteArray();
    const base64Audio = Buffer.from(audioBytes).toString("base64");

    const systemPrompt = buildSystemPrompt(purpose, audience, topic, selectedCriteria);

    // Call OpenAI
    const apiKey = await getSecret("OPENAI_API_KEY");
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-audio-1.5",
      modalities: ["text"],
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this presentation speech. Purpose: ${purpose}. Target Audience: ${audience}.${topic ? ` Topic: ${topic}.` : ""}`,
            },
            {
              type: "input_audio",
              input_audio: { data: base64Audio, format: "wav" },
            },
          ],
        },
      ],
    });

    let content = completion.choices[0].message.content;
    if (!content) throw new Error("No content received from OpenAI");

    // Strip markdown code blocks if present
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (content.startsWith("```")) {
      content = content.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const analysis = JSON.parse(content);

    // Filter to selected criteria
    const filterRecord = <T extends Record<string, unknown>>(
      record: T | undefined
    ): T | undefined => {
      if (!record) return record;
      return selectedCriteria.reduce<Record<string, unknown>>((acc, key) => {
        if (record[key] !== undefined) acc[key] = record[key];
        return acc;
      }, {}) as T;
    };

    if (analysis.subscores) {
      analysis.subscores = filterRecord(analysis.subscores);
    }
    if (analysis.criterionFeedback) {
      analysis.criterionFeedback = filterRecord(analysis.criterionFeedback);
    }
    if (analysis.overallImprovementPlan?.topPriorities) {
      const filtered = analysis.overallImprovementPlan.topPriorities.filter(
        (item: { criterion: string }) =>
          selectedCriteria.includes(item.criterion as CriterionKey)
      );
      analysis.overallImprovementPlan.topPriorities = filtered.map(
        (item: { criterion: string }, index: number) => ({
          ...item,
          priority: index + 1,
        })
      );
    }
    if (analysis.evidenceMoments) {
      analysis.evidenceMoments = analysis.evidenceMoments.filter(
        (item: { criterion: string }) =>
          selectedCriteria.includes(item.criterion as CriterionKey)
      );
    }

    const result: AnalysisResult = {
      ...analysis,
      criteria: selectedCriteria,
      privacyNote: "No transcript was generated or stored.",
    };

    // If projectId provided, store in DynamoDB
    if (projectId) {
      const existing = await getProjectItem(userId, projectId);
      if (existing) {
        const runId = uuidv4();
        const runNow = new Date().toISOString();
        const run: AnalysisRun = { id: runId, createdAt: runNow, analysis: result, s3Key };
        const history = Array.isArray(existing.analysisHistory)
          ? existing.analysisHistory
          : [];
        existing.analysis = result;
        existing.analysisHistory = [...history, run];
        await putProjectItem(existing);
      }
    }

    // Mark job as completed with result
    await updateJobStatus(userId, jobId, "completed", result);
  } catch (err: unknown) {
    console.error("processAnalysis error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    await updateJobStatus(userId, jobId, "failed", undefined, message);
  }
}

// ── getAnalysisJob: poll handler ──

export async function getAnalysisJob(
  userId: string,
  jobId: string
) {
  const job = await getJobItem(userId, jobId);
  if (!job) {
    return json(404, { error: "Job not found" });
  }

  return json(200, {
    jobId: job.jobId,
    status: job.status,
    result: job.result,
    error: job.error,
  });
}
