import { neon } from '@neondatabase/serverless'

interface CertRecord {
  token: string;
  hash: string;
  humanScore: number;
  title: string;
}

/**
 * Inserts a certificate row. Non-fatal: if DATABASE_URL is absent or the
 * query fails, we log and continue — the certificate has already been issued.
 */
export async function recordCertificate(record: CertRecord): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("[db] DATABASE_URL not configured — skipping certificate record");
    return;
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    await sql`
      INSERT INTO certificates (token, hash, human_score, title)
      VALUES (${record.token}, ${record.hash}, ${record.humanScore}, ${record.title})
    `;
  } catch (err) {
    console.error("[db] Failed to record certificate:", err);
  }
}
