import { NextResponse } from "next/server";
import { confirmPasswordReset } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, code, and new password are required" },
        { status: 400 }
      );
    }

    await confirmPasswordReset(email.trim().toLowerCase(), code, newPassword);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 400 }
    );
  }
}
