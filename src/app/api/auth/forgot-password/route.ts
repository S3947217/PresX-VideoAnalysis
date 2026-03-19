import { NextResponse } from "next/server";
import { forgotPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await forgotPassword(email.trim().toLowerCase());
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message =
      error.code === "UserNotFoundException"
        ? "No account found with this email"
        : error.message || "Failed to send reset code";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
