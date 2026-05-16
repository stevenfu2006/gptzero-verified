"use client";

import { useState, useRef, useEffect } from "react";
import Badge from "@/components/Badge";

interface CertResult {
  token: string;
  humanScore: number;
  hash: string;
  timestamp: number;
  title?: string;
}

type Tab = "text" | "pdf";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function Home() {
  const [tab, setTab] = useState<Tab>("text");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [totalCerts, setTotalCerts] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        const target: number = d.totalCertificates ?? 0;
        if (target === 0) return;
        setTotalCerts(target);
        const duration = 800;
        const steps = 40;
        const interval = duration / steps;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          setDisplayCount(Math.round((target * step) / steps));
          if (step >= steps) clearInterval(timer);
        }, interval);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-warm">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-serif text-xl text-navy">
            GPTZero <span className="text-green">Verified</span>
          </span>
          <a href="/verify" className="font-medium text-[15px] text-blue hover:text-blue-dark transition-colors">
            Verify a certificate →
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-12 pb-20">
        {IS_DEMO && !bannerDismissed && (
          <DemoBanner onDismiss={() => setBannerDismissed(true)} />
        )}

        {/* Hero */}
        <div className="text-center">
          <h1
            className="font-serif text-navy mx-auto text-center mb-4"
            style={{ fontSize: 'clamp(48px, 6vw, 68px)', fontWeight: 400, lineHeight: 1.15, maxWidth: '700px' }}
          >
            Prove Your Writing<br />Is Human
          </h1>
          <p className="text-muted text-base leading-[1.65] max-w-md mx-auto">
            Generate a cryptographic certificate of human authorship, scored and
            signed by GPTZero. Tamper-evident. No database required.
          </p>
        </div>

        {totalCerts !== null && (
          <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', marginTop: '16px' }}>
            {displayCount.toLocaleString()} documents certified and verified
          </p>
        )}

        <div style={{ marginTop: '40px' }}>
          {/* Tabs */}
          <div className="flex gap-6 border-b border-warm mb-8">
            {(["text", "pdf"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-blue text-navy"
                    : "border-transparent text-muted hover:text-navy"
                }`}
              >
                {t === "text" ? "Paste Text" : "Upload PDF"}
              </button>
            ))}
          </div>

          {tab === "text" ? <TextTab /> : <PdfTab />}
        </div>
      </main>

      <footer className="mt-24 border-t border-warm bg-white">
        <div className="max-w-[1100px] mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted">
          <span className="font-serif text-navy">GPTZero Verified</span>
          <a href="/verify-file" className="hover:text-navy transition-colors">
            Verify a stamped PDF →
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Shared input / button primitives ────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted uppercase tracking-[0.04em] mb-2">
      {children}
    </label>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-[6px] transition-colors whitespace-nowrap"
      style={{ padding: '12px 28px', fontSize: '15px' }}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 px-4 border border-warm hover:border-navy/30 rounded-md text-sm text-muted hover:text-navy transition-colors text-center"
    >
      {children}
    </button>
  );
}

// ─── Text tab ────────────────────────────────────────────────────────────────

function TextTab() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertResult | null>(null);
  const [copied, setCopied] = useState<"url" | "md" | null>(null);

  async function handleCertify() {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Certification failed."); return; }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copy(content: string, type: "url" | "md") {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* non-secure context */ }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = result ? `${origin}/verify?token=${result.token}` : "";
  const mdBadge = result
    ? `[![GPTZero Verified — ${Math.round(result.humanScore)}% Human](${origin}/api/badge?token=${result.token})](${verifyUrl})`
    : "";

  return (
    <>
      <div className="bg-white rounded-lg border border-warm">
        <div className="p-6 space-y-5">
          <div>
            <Label>
              Document title <span className="font-normal normal-case text-muted/60">(optional)</span>
            </Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cover letter for GPTZero"
              className="w-full px-4 py-3 rounded-md border border-warm bg-white text-navy placeholder:text-muted/50 text-sm focus:outline-none focus:ring-[3px] focus:ring-[rgba(26,86,219,0.12)] focus:border-blue transition-all"
            />
          </div>
          <div>
            <Label>Your writing</Label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type the text you want to certify…"
              className="w-full rounded-lg border border-warm bg-white text-navy placeholder:text-muted/50 font-sans leading-[1.65] focus:outline-none focus:border-blue focus:ring-[3px] focus:ring-[rgba(26,86,219,0.12)] transition-all resize-y"
              style={{ minHeight: '200px', padding: '16px', fontSize: '15px' }}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex items-center justify-between gap-4">
          <div>{error && <p className="text-sm text-bad">{error}</p>}</div>
          <PrimaryButton
            onClick={handleCertify}
            disabled={!text.trim() || isLoading}
            loading={isLoading}
          >
            {isLoading ? "Certifying…" : "Certify →"}
          </PrimaryButton>
        </div>
      </div>

      {result && (
        <CertResultCards
          result={result}
          verifyUrl={verifyUrl}
          mdBadge={mdBadge}
          copied={copied}
          onCopy={copy}
        />
      )}
    </>
  );
}

// ─── PDF tab ──────────────────────────────────────────────────────────────────

function PdfTab() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertResult | null>(null);
  const [copied, setCopied] = useState<"url" | "md" | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/certify-pdf", { method: "POST", body: fd });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail ? `${data.error}: ${data.detail}` : (data.error || "Certification failed."));
        return;
      }

      const token = res.headers.get("X-GPTZero-Token") ?? "";
      const humanScore = parseFloat(res.headers.get("X-GPTZero-Score") ?? "0");
      const hash = res.headers.get("X-GPTZero-Hash") ?? "";
      const timestamp = parseInt(res.headers.get("X-GPTZero-Timestamp") ?? "0", 10);
      const title = res.headers.get("X-GPTZero-Title") ?? "Document";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const nameMatch = disposition.match(/filename="([^"]+)"/);
      setDownloadUrl(url);
      setDownloadName(nameMatch?.[1] ?? "gptzero-verified.pdf");
      setResult({ token, humanScore, hash, timestamp, title });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copy(content: string, type: "url" | "md") {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* non-secure context */ }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = result ? `${origin}/verify?token=${result.token}` : "";
  const mdBadge = result
    ? `[![GPTZero Verified — ${Math.round(result.humanScore)}% Human](${origin}/api/badge?token=${result.token})](${verifyUrl})`
    : "";

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`bg-white rounded-lg border-2 border-dashed p-12 text-center transition-all ${
          isLoading ? "cursor-wait" : "cursor-pointer"
        } ${
          isDragging ? "border-blue bg-[#EEF3FD]" : "border-warm hover:border-navy/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          className="sr-only"
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-7 w-7 text-green" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium text-navy">Scoring and signing…</p>
            <p className="text-xs text-muted">Calling GPTZero API and embedding certificate</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-cream border border-warm flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M14 2v6h6M12 12v6M9 15l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">
                Drop a PDF here or <span className="text-blue">browse</span>
              </p>
              <p className="text-xs text-muted mt-1">
                The certificate is embedded directly into the PDF
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 bg-white border border-bad/20 rounded-md text-sm text-bad">
          {error}
        </div>
      )}

      {downloadUrl && result && (
        <a
          href={downloadUrl}
          download={downloadName}
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue hover:bg-blue-dark text-white font-medium rounded-md text-sm transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download signed PDF
        </a>
      )}

      {result && (
        <CertResultCards
          result={result}
          verifyUrl={verifyUrl}
          mdBadge={mdBadge}
          copied={copied}
          onCopy={copy}
        />
      )}
    </>
  );
}

// ─── Shared result cards ──────────────────────────────────────────────────────

function CertResultCards({
  result,
  verifyUrl,
  mdBadge,
  copied,
  onCopy,
}: {
  result: CertResult;
  verifyUrl: string;
  mdBadge: string;
  copied: "url" | "md" | null;
  onCopy: (content: string, type: "url" | "md") => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Badge preview card */}
      <div className="bg-white rounded-lg border border-warm p-6 flex flex-col">
        <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-5">
          Badge
        </p>
        <div className="flex-1 flex items-center justify-center mb-5 overflow-hidden">
          <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
            <Badge humanScore={result.humanScore} verifyUrl={verifyUrl} />
          </a>
        </div>
        <SecondaryButton onClick={() => onCopy(mdBadge, "md")}>
          {copied === "md" ? "✓ Copied!" : "Copy Markdown badge"}
        </SecondaryButton>
        <p className="text-xs text-muted mt-2 text-center">
          Works in GitHub READMEs and Markdown documents
        </p>
      </div>

      {/* Certificate card */}
      <div className="bg-white rounded-lg border border-warm p-6 flex flex-col">
        <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-5">
          Certificate
        </p>
        <div className="text-center mb-5">
          <span className="text-[64px] font-bold text-green leading-none">
            {result.humanScore.toFixed(1)}%
          </span>
          <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mt-2">
            Human Probability
          </p>
        </div>
        <div className="space-y-2.5 text-sm border-t border-warm pt-4 mb-5">
          <div className="flex justify-between items-baseline gap-3">
            <span className="text-muted shrink-0">Certified</span>
            <span className="text-navy font-medium text-right text-xs">
              {new Date(result.timestamp).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-3">
            <span className="text-muted shrink-0">Hash</span>
            <span className="font-mono text-muted text-xs text-right">
              {result.hash.slice(0, 8)}&hellip;{result.hash.slice(-6)}
            </span>
          </div>
        </div>
        <div className="mt-auto space-y-2">
          <SecondaryButton onClick={() => onCopy(verifyUrl, "url")}>
            {copied === "url" ? "✓ Copied!" : "Copy verify link"}
          </SecondaryButton>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 px-4 bg-blue hover:bg-blue-dark text-white rounded-md text-sm text-center font-medium transition-colors"
          >
            View certificate →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Demo mode banner ─────────────────────────────────────────────────────────

function DemoBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-10 flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-lg text-sm max-w-[680px] mx-auto">
      <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
      <p className="text-amber-800 flex-1 leading-relaxed">
        <strong>Demo mode</strong> — AI detection score is simulated. Set{" "}
        <code className="font-mono bg-[#FEF3C7] px-[5px] py-[1px] rounded-[3px]" style={{ fontSize: '12px' }}>GPTZERO_API_KEY</code>{" "}
        and remove{" "}
        <code className="font-mono bg-[#FEF3C7] px-[5px] py-[1px] rounded-[3px]" style={{ fontSize: '12px' }}>NEXT_PUBLIC_DEMO_MODE</code>{" "}
        to switch to real scores.
      </p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-amber-400 hover:text-amber-700 transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
