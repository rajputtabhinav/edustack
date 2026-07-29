import { BookOpenText, CheckCircle2, Download, FileText, LockKeyhole, MessageCircleMore, Wallet } from "lucide-react";

function DetailPill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/68">
      {children}
    </span>
  );
}

export function BuyNotesPage({ products, purchases, selectedProductId, onDepositSelect, onDownload, onSendToChat }) {
  const product = products?.find((entry) => String(entry._id) === String(selectedProductId)) || products?.[0] || null;
  const purchase = (purchases || []).find((entry) => String(entry.product?._id || entry.product) === String(product?._id));
  const isOwned = Boolean(purchase);
  const canDownload = Boolean(isOwned && purchase?.product?.downloadReady);
  const highlights = product?.highlights || [];
  const chapterOutline = product?.chapterOutline || [];

  function handleDownload() {
    if (canDownload) {
      onDownload?.(purchase.product._id);
    }
  }

  function handleSendToChat() {
    if (canDownload) {
      onSendToChat?.(purchase.product._id);
    }
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <section className="motion-card glass glass-buy rounded-[32px] border-cyan-400/12 px-6 py-[26px] shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
          <p className="text-[13px] font-medium text-white/55">AI Notes</p>
          <h2 className="mt-3 text-[26px] font-semibold leading-tight">AI Master Notes</h2>
          <p className="mt-2.5 text-[13px] text-white/58">No AI notes product is available right now.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="motion-card glass glass-buy rounded-[32px] border-cyan-400/12 px-6 py-[26px] shadow-[0_18px_40px_rgba(2,6,23,0.28)]" style={{ "--delay": "40ms" }}>
        <p className="text-[13px] font-medium text-white/55">Flagship AI Notes</p>
        <h2 className="mt-3 text-[26px] font-semibold leading-tight">{product.name}</h2>
        <p className="mt-2.5 text-[13px] text-white/58">
          A clean 351-page AI notes system built for serious learners. This package carries Rs.5000 worth of study value, and EduStack is offering it for only Rs.199.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <DetailPill>
            <FileText className="h-3.5 w-3.5 text-cyan-200" />
            Rs.{product.price}
          </DetailPill>
          <DetailPill>
            <BookOpenText className="h-3.5 w-3.5 text-cyan-200" />
            {product.fileSizeLabel || "351 pages"}
          </DetailPill>
          <DetailPill>
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" />
            Worth Rs.5000
          </DetailPill>
          <DetailPill>
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" />
            {product.fileVersion || "v1.0"}
          </DetailPill>
        </div>
      </section>

      <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22),0_0_0_1px_rgba(34,211,238,0.06)] backdrop-blur-xl" style={{ "--delay": "110ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Why this is different</p>
            <p className="mt-2 text-[13px] text-white/58">Designed like a premium study playbook with structured explanations, revision flow, practice questions, and compact exam-ready notes instead of generic copied content.</p>
          </div>
          <div className="rounded-full border border-cyan-300/16 bg-cyan-400/[0.08] px-3 py-1 text-[11px] font-medium text-cyan-100">
            98% OFF
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {highlights.map((item) => (
            <div key={item} className="motion-raise rounded-[22px] border border-cyan-400/10 bg-white/[0.04] px-4 py-3.5 text-[13px] text-white/78">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl" style={{ "--delay": "180ms" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Chapter outline</p>
        <p className="mt-2 text-[13px] text-white/58">Every section is written to help you understand AI concepts clearly and revise them quickly before tests, interviews, or self-study sessions.</p>
        <div className="mt-4 space-y-3">
          {chapterOutline.map((chapter, index) => (
            <div key={chapter} className="motion-raise flex items-start gap-3 rounded-[22px] border border-cyan-400/10 bg-white/[0.04] px-4 py-3.5">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-400/[0.08] text-[11px] font-semibold text-cyan-100">
                {index + 1}
              </span>
              <p className="text-[13px] text-white/80">{chapter}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl" style={{ "--delay": "250ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">{isOwned ? "Unlocked access" : "Unlock access"}</p>
            <p className="mt-2 text-[13px] text-white/58">
              {isOwned
                ? canDownload
                  ? "Your purchase is approved. Your AI Master Notes PDF is ready to download now."
                  : "Your purchase is approved, but the PDF file is not connected yet."
                : "Complete payment in Wallet and upload proof to unlock this 351-page AI Master Notes PDF for just Rs.199 after approval."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/68">
            {isOwned ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <LockKeyhole className="h-3.5 w-3.5 text-cyan-200" />}
            {isOwned ? "Unlocked" : "Locked"}
          </div>
        </div>

        <div className="mt-5">
          {isOwned ? (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={handleSendToChat}
                disabled={!canDownload}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-3 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(16,185,129,0.18)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 active:scale-[0.98] ${canDownload ? "" : "cursor-not-allowed opacity-50"}`}
              >
                <MessageCircleMore className="h-4 w-4" />
                {canDownload ? "Get PDF in Bot" : "PDF Not Ready"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!canDownload}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accentBlue to-accentCyan px-4 py-3 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(34,211,238,0.18)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 active:scale-[0.98] ${canDownload ? "" : "cursor-not-allowed opacity-50"}`}
              >
                <Download className="h-4 w-4" />
                {canDownload ? "Download PDF" : "Download Not Ready"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onDepositSelect(product._id, { openWallet: true })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accentBlue to-accentCyan px-4 py-3 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(34,211,238,0.18)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 active:scale-[0.98]"
            >
              <Wallet className="h-4 w-4" />
              Open Wallet to Unlock
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
