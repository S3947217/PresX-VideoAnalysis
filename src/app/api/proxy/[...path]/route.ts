import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

// Only allow proxying to these API paths
const ALLOWED_PATHS = new Set([
  "projects",
  "presign",
  "analyze",
  "checkout",
  "subscription",
  "coupon",
  "billing-portal",
  "notify-signup",
]);

function isAllowedPath(pathSegments: string[]): boolean {
  if (pathSegments.length === 0) return false;
  const root = pathSegments[0];
  // Allow "projects" and "projects/{id}"
  if (root === "projects" && pathSegments.length <= 2) return true;
  // Allow "analyze" and "analyze/{jobId}"
  if (root === "analyze" && pathSegments.length <= 2) return true;
  // Allow "audio-url/{s3Key...}" (s3Key has slashes, so length >= 2)
  if (root === "audio-url" && pathSegments.length >= 2) return true;
  // Allow single-segment paths in the allowlist
  if (pathSegments.length === 1 && ALLOWED_PATHS.has(root)) return true;
  return false;
}

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  if (!API_GATEWAY_URL) {
    return NextResponse.json(
      { error: "API_GATEWAY_URL not configured" },
      { status: 500 }
    );
  }

  if (!isAllowedPath(params.path)) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const path = params.path.join("/");
  const targetUrl = `${API_GATEWAY_URL}/${path}`;

  const cookieStore = await cookies();
  const idToken = cookieStore.get("presx-id-token")?.value;

  const headers: HeadersInit = {
    "Content-Type": request.headers.get("Content-Type") || "application/json",
  };

  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) {
      fetchOptions.body = body;
    }
  }

  const response = await fetch(targetUrl, fetchOptions);
  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}
