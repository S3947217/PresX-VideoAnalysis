import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === "production";
  const opts = { secure, sameSite: "lax" as const, path: "/", maxAge: 0 };

  res.cookies.set("presx-id-token", "", { ...opts, httpOnly: true });
  res.cookies.set("presx-refresh-token", "", { ...opts, httpOnly: true });
  res.cookies.set("presx-auth-session", "", { ...opts, httpOnly: false });

  return res;
}
