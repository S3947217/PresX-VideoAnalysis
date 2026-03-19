import { NextRequest, NextResponse } from "next/server";
import { resendConfirmationCode } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await resendConfirmationCode(email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.message || "Failed to resend code";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
