const GPTZERO_API = "https://api.gptzero.me/v2/predict/text";

/**
 * Returns human probability as a 0–100 percentage.
 * When NEXT_PUBLIC_DEMO_MODE=true, returns a realistic-looking mock instead
 * of calling the real API, so the app is fully usable without an API key.
 */
export async function scoreText(text: string): Promise<number> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    // Seed off the first 32 chars so the same text always gets the same mock
    // score within a session, which looks more realistic during a demo.
    const seed = text.split("").slice(0, 32).reduce((a, c) => a + c.charCodeAt(0), 0);
    const pseudo = ((seed * 9301 + 49297) % 233280) / 233280;
    return 85 + pseudo * 12; // 85–97 %
  }

  if (!process.env.GPTZERO_API_KEY) {
    throw new Error("GPTZERO_API_KEY is not set");
  }

  const res = await fetch(GPTZERO_API, {
    method: "POST",
    headers: {
      "x-api-key": process.env.GPTZERO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ document: text }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GPTZero API ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const prob = data?.documents?.[0]?.completely_generated_prob;

  if (typeof prob !== "number") {
    throw new Error("Unexpected GPTZero API response shape");
  }

  return (1 - prob) * 100;
}
