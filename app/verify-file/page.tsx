"use client";

import { useState, useRef } from "react";

interface CertPayload {
  hash: string;
  humanScore: number;
  timestamp: number;
  title: string;
}

interface VerifyResult {
  valid: boolean;
  payload: CertPayload | null;
  error: string | null;
}

export default function VerifyFilePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setResult({ valid: false, payload: null, error: "Please upload a PDF file." });
      return;
    }
    setFileName(file.name);
    setIsLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/verify-file", { method: "POST", body: fd });
      setResult(await res.json());
    } catch {
      setResult({ valid: false, payload: null, error: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-warm">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="font-serif text-xl text-navy">
            GPTZero <span className="text-green">Verified</span>
          </a>
          <a href="/" className="text-sm text-muted hover:text-navy transition-colors">
            ← Certify a document
          </a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl text-navy mb-4">
            Verify a Stamped PDF
          </h1>
          <p className="text-muted text-base leading-[1.65]">
            Upload a GPTZero-stamped PDF to verify its embedded certificate.
            No internet connection to the original issuer required.
          </p>
        </div>

        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
            onClick={() => !isLoading && inputRef.current?.click()}
            className={`bg-white rounded-lg border-2 border-dashed p-14 text-center transition-all ${
              isLoading ? "cursor-wait" : "cursor-pointer"
            } ${
              isDragging
                ? "border-blue bg-[#EEF3FD]"
                : "border-warm hover:border-navy/30"
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
                <p className="text-sm font-medium text-navy">Reading PDF metadata…</p>
                {fileName && <p className="text-xs text-muted font-mono">{fileName}</p>}
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
                  <p className="text-xs text-muted mt-1">Only GPTZero-stamped PDFs can be verified</p>
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div>
            {result.valid && result.payload ? (
              <ValidResult payload={result.payload} fileName={fileName} />
            ) : (
              <InvalidResult error={result.error} fileName={fileName} />
            )}
            <button
              onClick={reset}
              className="mt-4 w-full py-2.5 border border-warm hover:border-navy/30 rounded-md text-sm text-muted hover:text-navy transition-all text-center"
            >
              Verify another file
            </button>
          </div>
        )}

        <p className="text-xs text-muted text-center mt-10 leading-relaxed max-w-sm mx-auto">
          Verification works by reading the certificate embedded in the PDF
          metadata — no connection to the original issuer required.
        </p>
      </main>
    </div>
  );
}

function ValidResult({ payload, fileName }: { payload: CertPayload; fileName: string | null }) {
  const formattedDate = new Date(payload.timestamp).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="bg-white rounded-lg border border-warm overflow-hidden">
      <div className="px-8 pt-8 pb-7 border-b border-warm">
        <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-5">
          Certificate of Human Authorship
        </p>
        <h2 className="font-serif text-[40px] text-green leading-tight">
          ✓ Verified Human
        </h2>
      </div>

      <div className="px-8 py-7 space-y-6">
        {fileName && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-1.5">File</p>
            <p className="font-mono text-navy text-xs">{fileName}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-2">Document</p>
          <p className="font-serif text-2xl text-navy">{payload.title}</p>
        </div>

        <hr className="border-warm" />

        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-2">
            Human Probability
          </p>
          <p className="text-[72px] font-bold text-green leading-none">
            {payload.humanScore.toFixed(1)}%
          </p>
        </div>

        <hr className="border-warm" />

        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-1.5">Certified on</p>
            <p className="text-navy text-sm leading-relaxed">{formattedDate}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-1.5">Content Hash (SHA-256)</p>
            <p className="font-mono text-muted text-xs break-all leading-relaxed">{payload.hash}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-4 bg-cream border-t border-warm flex items-center justify-between">
        <span className="text-xs text-muted">Verified by GPTZero AI Detection</span>
        <span className="text-xs text-muted">gptzero.me</span>
      </div>
    </div>
  );
}

function InvalidResult({ error, fileName }: { error: string | null; fileName: string | null }) {
  return (
    <div className="bg-white rounded-lg border border-bad/20 overflow-hidden">
      <div className="px-8 pt-8 pb-7 border-b border-bad/10">
        <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-5">
          Certificate Verification
        </p>
        <h2 className="font-serif text-[40px] text-bad leading-tight">
          ✗ Verification Failed
        </h2>
      </div>
      <div className="px-8 py-7">
        {fileName && (
          <p className="font-mono text-muted text-xs mb-4">{fileName}</p>
        )}
        <p className="text-navy text-sm leading-[1.65]">
          {error ?? "No certificate could be found or verified in this file."}
        </p>
        <p className="text-muted text-sm mt-4 leading-[1.65]">
          Only PDFs stamped by GPTZero Verified contain an embedded certificate.
          If this file was stamped, the metadata may have been stripped by a PDF editor.
        </p>
      </div>
      <div className="px-8 py-4 bg-cream border-t border-warm">
        <a href="/" className="text-sm text-muted hover:text-navy transition-colors">
          ← Certify a new document
        </a>
      </div>
    </div>
  );
}
