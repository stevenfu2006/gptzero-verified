import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { verifyToken } from "@/lib/cert";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  } catch {
    return NextResponse.json({ error: "Could not parse PDF file." }, { status: 400 });
  }

  // Token is stored as the second entry in the Keywords array
  const keywords = pdfDoc.getKeywords();
  if (!keywords) {
    return NextResponse.json(
      { valid: false, error: "No GPTZero certificate found in this PDF's metadata." },
      { status: 200 }
    );
  }

  // Keywords is a comma-separated string; the token is after "gptzero-verified,"
  const parts = keywords.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  const token = parts.find((p) => p !== "gptzero-verified");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "No GPTZero certificate token found in this PDF." },
      { status: 200 }
    );
  }

  const result = verifyToken(token);

  return NextResponse.json({
    valid: result.valid,
    payload: result.payload ?? null,
    error: result.error ?? null,
  });
}
