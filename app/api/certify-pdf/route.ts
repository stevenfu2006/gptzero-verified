import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { scoreText } from "@/lib/gptzero";
import { recordCertificate } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 50_000;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.CERT_SECRET) {
      return NextResponse.json(
        { error: "Server misconfiguration: missing CERT_SECRET" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    console.log("[certify-pdf] pdfBuffer.length:", pdfBuffer.length);

    // Dynamic import of internal path bypasses pdf-parse's test-file lookup on module init.
    // CJS module.exports = PDF — .default may be undefined depending on the bundler; fall back to the module itself.
    // @ts-ignore — no types for this subpath; signature is identical to the package root
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    // @ts-ignore
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = pdfParseModule.default ?? pdfParseModule;

    let extractedText: string;
    try {
      const data = await pdfParse(pdfBuffer);
      extractedText = data.text?.trim() ?? "";
      console.log("[certify-pdf] extractedText.length:", extractedText.length);
    } catch (parseErr) {
      console.error("[certify-pdf] pdf-parse error:", parseErr);
      return NextResponse.json({ error: "Could not parse PDF file." }, { status: 400 });
    }

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        {
          error:
            "This PDF appears to be image-based or scanned. Please paste the text directly using the text tab.",
        },
        { status: 422 }
      );
    }

    const text = extractedText.slice(0, MAX_CHARS);

    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    } catch {
      return NextResponse.json({ error: "Could not load PDF for stamping." }, { status: 400 });
    }

    const originalTitle =
      pdfDoc.getTitle() ??
      (file instanceof File ? file.name.replace(/\.pdf$/i, "") : "Document");

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

    const timestamp = Date.now();
    const payload = { hash, humanScore, timestamp, title: originalTitle };

    const sig = crypto
      .createHmac("sha256", process.env.CERT_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    const token = Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");

    await recordCertificate({ token, hash, humanScore, title: originalTitle });

    pdfDoc.setTitle(originalTitle);
    pdfDoc.setSubject("GPTZero Verified Human Document");
    pdfDoc.setKeywords(["gptzero-verified", token]);
    pdfDoc.setCreator(`GPTZero Verified | Score: ${humanScore.toFixed(1)}%`);
    pdfDoc.setProducer("GPTZero Verified — gptzero.me");

    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Top-right notary seal — 20pt from each edge (pdf-lib origin: bottom-left)
    const sealR  = 22;
    const sealCx = width - 50;
    const sealCy = height - 50;

    const navy      = rgb(0.051, 0.106, 0.165);   // #0D1B2A
    const white     = rgb(1, 1, 1);
    const sealGreen = rgb(0.114, 0.478, 0.373);   // #1D7A5F

    // Filled background disc
    firstPage.drawCircle({ x: sealCx, y: sealCy, size: sealR, color: navy });
    // Outer white ring
    firstPage.drawCircle({ x: sealCx, y: sealCy, size: 16, borderColor: white, borderWidth: 1.5 });
    // Inner white ring (thin, approximate dashed)
    firstPage.drawCircle({ x: sealCx, y: sealCy, size: 10, borderColor: white, borderWidth: 0.75 });
    // Center dot
    firstPage.drawCircle({ x: sealCx, y: sealCy, size: 3, color: white });

    // Labels below seal
    const label  = "GPTZero Verified";
    const score  = `${humanScore.toFixed(1)}% Human`;
    const labelW = helvetica.widthOfTextAtSize(label, 6);
    const scoreW = helveticaBold.widthOfTextAtSize(score, 6);

    firstPage.drawText(label, {
      x: sealCx - labelW / 2,
      y: sealCy - sealR - 8,
      size: 6, font: helvetica, color: white,
    });
    firstPage.drawText(score, {
      x: sealCx - scoreW / 2,
      y: sealCy - sealR - 16,
      size: 6, font: helveticaBold, color: sealGreen,
    });

    const signedPdfBytes = await pdfDoc.save();
    const filename = `gptzero-verified-${originalTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;

    return new Response(Buffer.from(signedPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-GPTZero-Token": token,
        "X-GPTZero-Score": humanScore.toFixed(2),
        "X-GPTZero-Hash": hash,
        "X-GPTZero-Timestamp": timestamp.toString(),
        "X-GPTZero-Title": originalTitle,
      },
    });
  } catch (err) {
    console.error("[certify-pdf] unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
