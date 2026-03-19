import { Project, AnalysisResult, SubscriptionStatus, AnalysisJobResponse } from "@/types/project";

const API_BASE = "/api/proxy";

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(
      body.error || "unknown",
      body.message || body.error || `API error: ${res.status}`,
      res.status
    );
  }

  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/projects");
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    return await apiFetch<Project>(`/projects/${id}`);
  } catch {
    return null;
  }
}

export async function saveProject(project: Omit<Project, "id"> & { id?: string }): Promise<Project> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

export async function updateProject(project: Project): Promise<Project> {
  return apiFetch<Project>(`/projects/${project.id}`, {
    method: "PUT",
    body: JSON.stringify(project),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiFetch(`/projects/${id}`, { method: "DELETE" });
}

export async function getPresignedUrl(contentType: string = "audio/wav"): Promise<{ url: string; key: string }> {
  return apiFetch<{ url: string; key: string }>("/presign", {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export async function uploadToS3(presignedUrl: string, blob: Blob): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": blob.type || "audio/wav" },
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
}

export async function submitAnalysisJob(params: {
  s3Key: string;
  purpose: string;
  audience: string;
  topic: string;
  criteria: string[];
  projectId?: string;
}): Promise<{ jobId: string }> {
  return apiFetch<{ jobId: string }>("/analyze", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getAnalysisJobStatus(jobId: string): Promise<AnalysisJobResponse> {
  return apiFetch<AnalysisJobResponse>(`/analyze/${jobId}`);
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 5 * 60 * 1000; // 5 minutes

export async function analyzeAudioAsync(
  params: {
    s3Key: string;
    purpose: string;
    audience: string;
    topic: string;
    criteria: string[];
    projectId?: string;
  },
  onStatusChange?: (status: string) => void
): Promise<AnalysisResult> {
  onStatusChange?.("submitting");
  const { jobId } = await submitAnalysisJob(params);
  onStatusChange?.("processing");

  const deadline = Date.now() + POLL_MAX_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const job = await getAnalysisJobStatus(jobId);

    if (job.status === "completed" && job.result) {
      onStatusChange?.("completed");
      return job.result;
    }
    if (job.status === "failed") {
      throw new Error(job.error || "Analysis failed");
    }
  }

  throw new Error("Analysis timed out. Please try again.");
}

export async function createCheckoutSession(params: {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  return apiFetch<{ sessionId: string; url: string }>("/checkout", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createBillingPortalSession(params: {
  returnUrl: string;
}): Promise<{ url: string }> {
  return apiFetch<{ url: string }>("/billing-portal", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getAudioPlaybackUrl(s3Key: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>(`/audio-url/${s3Key}`);
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiFetch<SubscriptionStatus>("/subscription");
}

export async function applyCoupon(
  code: string
): Promise<{ success: boolean; error?: string; subscription?: SubscriptionStatus }> {
  const res = await fetch(`${API_BASE}/coupon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return res.json();
}
