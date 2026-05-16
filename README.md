# GPTZero Verified

A cryptographic certificate of human authorship.

GPTZero's existing product is reactive: it detects AI after the fact. This is the proactive complement: a portable, tamper-evident certificate that travels with a piece of writing, the way a Creative Commons license does.

**[Live demo →](https://your-vercel-url.vercel.app)**

## What it does

- Paste text or upload a PDF
- The app SHA-256 hashes the content, scores it with GPTZero, and signs a certificate token (HMAC-SHA256)
- Returns a shareable verify URL and an embeddable badge
- For PDFs: embeds the certificate directly into the file metadata and stamps a visual seal on page 1
- The certificate is tamper-evident — editing the token in the URL causes verification to fail

## Tamper-evident demo

1. Certify any text
2. Copy the verify link
3. In the URL, find the base64 token and decode it
4. Change the `humanScore` field
5. Re-encode and paste back into the URL
6. Hit verify → "✗ Verification Failed"

This proves the certificate is cryptographically bound to the original content and score — not just cosmetic.

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · Vercel Postgres · pdf-lib · pdf-parse · Node.js crypto

## Running locally

```bash
git clone https://github.com/yourusername/gptzero-verified
cd gptzero-verified
npm install
cp .env.example .env.local
# Fill in CERT_SECRET and DATABASE_URL
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `CERT_SECRET` | Any long random string — used for HMAC signing |
| `GPTZERO_API_KEY` | From gptzero.me/api — leave unset to run in demo mode |
| `DEMO_MODE` | Set to `true` to simulate scores without an API key |
| `POSTGRES_URL` | Provisioned automatically by Vercel Postgres |

## Swapping in the real GPTZero API

Set `GPTZERO_API_KEY` and `DEMO_MODE=false` in your environment. No code changes needed.
