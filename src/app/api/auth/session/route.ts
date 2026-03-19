import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const idToken = request.cookies.get("presx-id-token")?.value;

  if (!idToken) {
    // No ID token — try refreshing if we have a refresh token
    return attemptRefresh(request);
  }

  try {
    const payload = decodeJwtPayload(idToken);

    // Token still valid — return user data
    if (!payload.exp || (payload.exp as number) * 1000 >= Date.now()) {
      return NextResponse.json({
        user: {
          email: payload.email as string,
          name: (payload.name as string) ?? "",
          id: (payload.sub as string) ?? "",
        },
      });
    }

    // Token expired — try refreshing
    return attemptRefresh(request, payload.email as string);
  } catch {
    return NextResponse.json({ user: null });
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payloadB64 = token.split(".")[1];
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString());
}

async function attemptRefresh(
  request: NextRequest,
  email?: string
): Promise<NextResponse> {
  const refreshToken = request.cookies.get("presx-refresh-token")?.value;

  if (!refreshToken) {
    return clearSessionCookies();
  }

  // If email wasn't passed (no ID token at all), try to decode it from the
  // expired ID token cookie. If that also fails, we can't refresh.
  if (!email) {
    const expiredIdToken = request.cookies.get("presx-id-token")?.value;
    if (expiredIdToken) {
      try {
        email = decodeJwtPayload(expiredIdToken).email as string;
      } catch {
        return clearSessionCookies();
      }
    }
    if (!email) {
      return clearSessionCookies();
    }
  }

  try {
    const session = await refreshSession(email, refreshToken);
    const newIdToken = session.getIdToken().getJwtToken();
    const payload = session.getIdToken().decodePayload();

    const res = NextResponse.json({
      user: {
        email: payload.email as string,
        name: (payload.name as string) ?? "",
        id: (payload.sub as string) ?? "",
      },
    });

    const secure = process.env.NODE_ENV === "production";

    res.cookies.set("presx-id-token", newIdToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return res;
  } catch {
    return clearSessionCookies();
  }
}

function clearSessionCookies(): NextResponse {
  const res = NextResponse.json({ user: null });
  const secure = process.env.NODE_ENV === "production";
  const opts = { secure, sameSite: "lax" as const, path: "/", maxAge: 0 };

  res.cookies.set("presx-id-token", "", { ...opts, httpOnly: true });
  res.cookies.set("presx-refresh-token", "", { ...opts, httpOnly: true });
  res.cookies.set("presx-auth-session", "", { ...opts, httpOnly: false });
  return res;
}
