import crypto from "crypto";

export interface CertPayload {
  hash: string;
  humanScore: number;
  timestamp: number;
  title: string;
}

export interface VerifyResult {
  valid: boolean;
  payload?: CertPayload;
  error?: string;
}

export function verifyToken(token: string): VerifyResult {
  const secret = process.env.CERT_SECRET;
  if (!secret) {
    return { valid: false, error: "Server misconfiguration" };
  }

  let parsed: { payload: CertPayload; sig: string };
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, error: "Malformed token" };
  }

  const { payload, sig } = parsed;
  if (!payload || typeof sig !== "string") {
    return { valid: false, error: "Malformed token" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    valid = false;
  }

  if (!valid) {
    return {
      valid: false,
      error: "Signature mismatch — this certificate has been tampered with.",
    };
  }

  return { valid: true, payload };
}
