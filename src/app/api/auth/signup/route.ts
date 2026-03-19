import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = (await request.json()) as {
      email?: string;
      password?: string;
      fullName?: string;
    };

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    await signUp(email, password, fullName);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.message || "Sign up failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
