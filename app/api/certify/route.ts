import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { scoreText } from "@/lib/gptzero";
import { recordCertificate } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { text, title } = await req.json();

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  if (!process.env.CERT_SECRET) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing CERT_SECRET" },
      { status: 500 }
    );
  }

  const hash = crypto.createHash("sha256").update(text).digest("hex");

  // ─── GPTZero API Integration ─────────────────────────────────────────
  // Currently running in DEMO MODE — scores are simulated (85–97% range).
  // To switch to real GPTZero detection:
  //   1. Get an API key at gptzero.me/api
  //   2. Add to .env.local:  GPTZERO_API_KEY=your_key_here
  //   3. Set:                DEMO_MODE=false
  // The callGPTZero() function below is already wired — no other changes needed.
  // ─────────────────────────────────────────────────────────────────────
  let humanScore: number;
  try {
    humanScore = await scoreText(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const payload = {
    hash,
    humanScore,
    timestamp: Date.now(),
    title: title?.trim() || "Untitled",
  };

  const sig = crypto
    .createHmac("sha256", process.env.CERT_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  const token = Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");

  await recordCertificate({ token, hash, humanScore, title: payload.title });

  return NextResponse.json({ token, humanScore, hash, timestamp: payload.timestamp });
}
