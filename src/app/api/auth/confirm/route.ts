import { NextRequest, NextResponse } from "next/server";
import { confirmSignUp } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = (await request.json()) as {
      email?: string;
      code?: string;
    };

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    await confirmSignUp(email, code);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.message || "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
