import { NextRequest, NextResponse } from "next/server";

const ADALO_API_KEY = process.env.ADALO_API_KEY!;
const ADALO_APP_ID = process.env.ADALO_APP_ID!;
const ADALO_USERS_COLLECTION_ID = process.env.ADALO_USERS_COLLECTION_ID!;
const ADALO_BASE = `https://api.adalo.com/v0/apps/${ADALO_APP_ID}`;

interface AdaloUser {
  id: number;
  Email: string;
  "Full Name": string;
  "First Name": string;
  "Last Name": string;
}

interface AdaloResponse {
  records: AdaloUser[];
  offset: number;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query Adalo Users collection filtered by email
    const url = new URL(
      `${ADALO_BASE}/collections/${ADALO_USERS_COLLECTION_ID}`
    );
    url.searchParams.set("filterKey", "Email");
    url.searchParams.set("filterValue", normalizedEmail);
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ADALO_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Adalo API error:", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as AdaloResponse;

    if (data.records.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const user = data.records[0];
    return NextResponse.json({
      exists: true,
      firstName: user["First Name"] || "",
      lastName: user["Last Name"] || "",
    });
  } catch (error) {
    console.error("check-email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
