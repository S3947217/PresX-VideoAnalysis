import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const session = await signIn(email, password);
    const idToken = session.getIdToken().getJwtToken();
    const refreshToken = session.getRefreshToken().getToken();
    const payload = session.getIdToken().decodePayload();

    const res = NextResponse.json({
      email: payload.email as string,
      name: (payload.name as string) ?? "",
    });

    const secure = process.env.NODE_ENV === "production";
    const thirtyDays = 30 * 24 * 60 * 60;

    // Store ID token in httpOnly cookie — not accessible from JS
    res.cookies.set("presx-id-token", idToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour (matches Cognito id token validity)
    });

    // Store refresh token — used to silently renew expired ID tokens
    res.cookies.set("presx-refresh-token", refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: thirtyDays,
    });

    // Signal cookie for middleware — lasts 30 days so middleware doesn't
    // redirect while the refresh token can still renew the session
    res.cookies.set("presx-auth-session", "1", {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: thirtyDays,
    });

    return res;
  } catch (error: any) {
    const message = error?.message || "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
