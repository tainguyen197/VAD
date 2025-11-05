import { NextResponse } from "next/server";

const DEEPGRAM_API_KEY = process.env.WTF;

export async function GET() {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "Missing DEEPGRAM_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ttl_seconds: 3600,
      }),
    });
    // Explicitly handle HTTP errors
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Deepgram request failed",
          status: response.status,
          statusText: response.statusText,
          details: text || undefined,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error getting Deepgram token: ", error);
    return NextResponse.json(
      { error: "Failed to get Deepgram token" },
      { status: 500 }
    );
  }
}
