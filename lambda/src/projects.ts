import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import {
  getProjectItem,
  putProjectItem,
  deleteProjectItem,
  queryUserProjects,
  userPK,
  projectSK,
} from "./dynamodb.js";
import type { ProjectItem, Project } from "./types.js";

const s3 = new S3Client({});
const BUCKET_NAME = process.env.S3_AUDIO_BUCKET || "presx-dev-audio-uploads";

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function listProjects(userId: string) {
  const items = await queryUserProjects(userId);
  const projects: Project[] = items
    .map(({ PK, SK, ...rest }) => rest as unknown as Project)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  return json(200, projects);
}

export async function createProject(
  userId: string,
  event: APIGatewayProxyEventV2
) {
  const body = JSON.parse(event.body || "{}");
  const { name, purpose, audience, topic, analysis, analysisHistory } = body;

  if (!name || !purpose) {
    return json(400, { error: "name and purpose are required" });
  }

  if (typeof name !== "string" || name.length > 200) {
    return json(400, { error: "name must be a string under 200 characters" });
  }
  if (typeof purpose !== "string" || purpose.length > 500) {
    return json(400, { error: "purpose must be a string under 500 characters" });
  }
  if (audience && (typeof audience !== "string" || audience.length > 200)) {
    return json(400, { error: "audience must be a string under 200 characters" });
  }
  if (topic && (typeof topic !== "string" || topic.length > 500)) {
    return json(400, { error: "topic must be a string under 500 characters" });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  const item: ProjectItem = {
    PK: userPK(userId),
    SK: projectSK(id),
    id,
    name,
    purpose,
    audience: audience || "General Audience",
    topic: topic || "",
    createdAt: now,
    analysis: analysis || null,
    analysisHistory: analysisHistory || [],
  };

  await putProjectItem(item);
  const { PK, SK, ...project } = item;
  return json(201, project);
}

export async function getProject(userId: string, projectId: string) {
  const item = await getProjectItem(userId, projectId);
  if (!item) {
    return json(404, { error: "Project not found" });
  }
  const { PK, SK, ...project } = item;
  return json(200, project);
}

export async function updateProject(
  userId: string,
  projectId: string,
  event: APIGatewayProxyEventV2
) {
  const existing = await getProjectItem(userId, projectId);
  if (!existing) {
    return json(404, { error: "Project not found" });
  }

  const body = JSON.parse(event.body || "{}");
  const updated: ProjectItem = {
    ...existing,
    name: body.name ?? existing.name,
    purpose: body.purpose ?? existing.purpose,
    audience: body.audience ?? existing.audience,
    topic: body.topic ?? existing.topic,
    analysis: body.analysis !== undefined ? body.analysis : existing.analysis,
    analysisHistory:
      body.analysisHistory !== undefined
        ? body.analysisHistory
        : existing.analysisHistory,
  };

  await putProjectItem(updated);
  const { PK, SK, ...project } = updated;
  return json(200, project);
}

export async function deleteProject(userId: string, projectId: string) {
  // Get project to find s3Keys in analysis history
  const project = await getProjectItem(userId, projectId);

  // Delete S3 audio files
  if (project) {
    const s3Keys: string[] = [];
    for (const run of project.analysisHistory || []) {
      if (run.s3Key) s3Keys.push(run.s3Key);
    }
    if (s3Keys.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: { Objects: s3Keys.map((Key) => ({ Key })) },
      }));
    }
  }

  await deleteProjectItem(userId, projectId);
  return json(200, { deleted: true });
}
