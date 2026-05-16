import { verifyToken, type CertPayload } from "@/lib/cert";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Shell>
        <InvalidCertificate
          heading="No Token Provided"
          detail="Please use a valid certificate URL. Links look like /verify?token=…"
        />
      </Shell>
    );
  }

  const result = verifyToken(token);

  return (
    <Shell>
      {result.valid && result.payload ? (
        <ValidCertificate payload={result.payload} />
      ) : (
        <InvalidCertificate
          heading="Verification Failed"
          detail={result.error ?? "This certificate is invalid or has been tampered with."}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
      <main className="max-w-lg mx-auto px-6 py-16">{children}</main>
    </div>
  );
}

function ValidCertificate({ payload }: { payload: CertPayload }) {
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
      {/* Card header */}
      <div className="px-8 pt-8 pb-7 border-b border-warm">
        <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-5">
          Certificate of Human Authorship
        </p>
        <h1 className="font-serif text-[40px] text-green leading-tight">
          ✓ Verified Human
        </h1>
      </div>

      {/* Card body */}
      <div className="px-8 py-7 space-y-6">
        {/* Document title */}
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-2">
            Document
          </p>
          <p className="font-serif text-2xl text-navy">{payload.title}</p>
        </div>

        <hr className="border-warm" />

        {/* Score — hero number */}
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-2">
            Human Probability
          </p>
          <p className="text-[72px] font-bold text-green leading-none">
            {payload.humanScore.toFixed(1)}%
          </p>
        </div>

        <hr className="border-warm" />

        {/* Metadata */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-1.5">
              Certified on
            </p>
            <p className="text-navy text-sm leading-relaxed">{formattedDate}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-1.5">
              Content Hash (SHA-256)
            </p>
            <p className="font-mono text-muted text-xs break-all leading-relaxed">
              {payload.hash}
            </p>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-8 py-4 bg-cream border-t border-warm flex items-center justify-between">
        <span className="text-xs text-muted">Verified by GPTZero AI Detection</span>
        <span className="text-xs text-muted">gptzero.me</span>
      </div>
    </div>
  );
}

function InvalidCertificate({ heading, detail }: { heading: string; detail: string }) {
  return (
    <div className="bg-white rounded-lg border border-bad/20 overflow-hidden">
      {/* Card header */}
      <div className="px-8 pt-8 pb-7 border-b border-bad/10">
        <p className="text-xs font-medium text-muted uppercase tracking-[0.04em] mb-5">
          Certificate Verification
        </p>
        <h1 className="font-serif text-[40px] text-bad leading-tight">
          ✗ {heading}
        </h1>
      </div>

      {/* Card body */}
      <div className="px-8 py-7">
        <p className="text-navy text-sm leading-[1.65]">{detail}</p>
        <p className="text-muted text-sm mt-4 leading-[1.65]">
          This may mean the certificate URL was manually edited, the content was
          altered after signing, or the link was corrupted in transit.
        </p>
      </div>

      {/* Card footer */}
      <div className="px-8 py-4 bg-cream border-t border-warm">
        <a href="/" className="text-sm text-muted hover:text-navy transition-colors">
          ← Certify a new document
        </a>
      </div>
    </div>
  );
}
