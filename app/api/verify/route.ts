import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/cert";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "token query param is required" },
      { status: 400 }
    );
  }

  const result = verifyToken(token);

  return NextResponse.json(
    { valid: result.valid, payload: result.payload ?? null, error: result.error ?? null },
    { status: 200 }
  );
}
