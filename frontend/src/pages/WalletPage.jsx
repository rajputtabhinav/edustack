import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, QrCode, UploadCloud } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { resolveApiUrl } from "../lib/api";
import { configureMainButton, requestFileDownload, triggerImpact, triggerNotification } from "../lib/telegram";

const SUPPORTED_UPI_APPS = [
  { name: "GPay", mark: "G", className: "from-sky-400/24 to-blue-400/24 text-sky-100 border-sky-300/20" },
  { name: "PhonePe", mark: "P", className: "from-violet-400/24 to-fuchsia-400/24 text-violet-100 border-violet-300/20" },
  { name: "Paytm", mark: "P", className: "from-cyan-400/24 to-sky-400/24 text-cyan-100 border-cyan-300/20" },
  { name: "BHIM", mark: "B", className: "from-amber-400/24 to-orange-400/24 text-amber-100 border-amber-300/20" }
];

function PaymentQrCard({ label, qrUrl, amount }) {
  function handleDownload() {
    if (!qrUrl) {
      return;
    }

    const filename = `edustack-${label.toLowerCase().replace(/\s+/g, "-")}-qr-${Date.now()}.png`;
    const requested = requestFileDownload({
      url: `${qrUrl}${qrUrl.includes("?") ? "&" : "?"}download=1&filename=${encodeURIComponent(filename)}`,
      filename
    });

    if (requested) {
      triggerImpact("light");
      return;
    }

    triggerNotification("error");
  }

  return (
    <div className="motion-raise rounded-[24px] border border-cyan-400/14 bg-cyan-400/[0.06] px-4 py-4 shadow-[0_14px_28px_rgba(2,6,23,0.18),0_0_0_1px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
          <p className="mt-2 text-[13px] text-white/68">Take a screenshot of this QR, pay Rs.{amount}, then upload your proof below.</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-gradient-to-br from-accentBlue/18 to-accentCyan/18 shadow-[0_10px_20px_rgba(34,211,238,0.12)]">
          <QrCode className="h-4.5 w-4.5 text-cyan-200" />
        </span>
      </div>
      <div className="mt-4 flex justify-center">
        <div className="rounded-[26px] border border-cyan-300/16 bg-white px-5 py-5 shadow-[0_18px_30px_rgba(2,6,23,0.12)]">
          {qrUrl ? (
            <img src={qrUrl} alt={`${label} payment QR`} className="h-52 w-52 rounded-[18px] object-contain" />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-[18px] bg-slate-100 text-[12px] font-medium text-slate-500">
              Generating QR...
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-[20px] border border-cyan-300/12 bg-white/[0.04] px-4 py-3 text-[12px] text-white/62">
        Take a clear screenshot before switching to your UPI app. After payment, return here and upload the screenshot as proof.
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accentBlue to-accentCyan px-4 py-3 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(34,211,238,0.18)] transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ${qrUrl ? "" : "pointer-events-none opacity-50"}`}
      >
        Download QR
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

function SupportedUpiApps() {
  return (
    <div className="motion-raise rounded-[22px] border border-cyan-400/10 bg-white/[0.04] px-4 py-4 shadow-[0_10px_20px_rgba(2,6,23,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-white/76">Supported UPI apps</p>
          <p className="mt-1 text-[12px] text-white/50">Complete deposit in any major UPI app</p>
        </div>
        <div className="rounded-full border border-cyan-300/14 bg-cyan-400/[0.08] px-3 py-1 text-[11px] font-medium text-cyan-100">
          UPI enabled
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {SUPPORTED_UPI_APPS.map((app) => (
          <div key={app.name} className="motion-raise inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full border bg-gradient-to-br text-[11px] font-semibold ${app.className}`}>
              {app.mark}
            </span>
            <span className="text-[12px] font-medium text-white/74">{app.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WalletPage({
  user,
  config,
  paymentHistory,
  products,
  purchases,
  selectedProductId,
  onDepositSelect,
  onUpload
}) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  const notePrice = config.notePrice || 199;
  const purchasedProductIds = new Set((purchases || []).map((purchase) => String(purchase.product?._id || purchase.product)));
  const availableProducts = (products || []).filter((product) => !purchasedProductIds.has(String(product._id)));
  const selectedProduct = availableProducts.find((product) => String(product._id) === String(selectedProductId)) || availableProducts[0] || null;
  const selectedAmount = notePrice;
  const paymentRoutes = (config.paymentRoutes || []).map((route) => ({
    ...route,
    qrUrl: resolveApiUrl(`/payment/qr/${encodeURIComponent(route.key)}`)
  }));
  const activePaymentRoute = paymentRoutes[0] || null;
  const selectedOptionIndex = selectedProduct ? availableProducts.findIndex((product) => String(product._id) === String(selectedProduct._id)) + 1 : 0;

  useEffect(() => {
    const canSubmit = Boolean(selectedProduct);
    return configureMainButton({
      text: submitting ? "Submitting..." : "Submit Proof",
      isVisible: true,
      isEnabled: canSubmit && !submitting,
      isLoading: submitting,
      onClick: canSubmit ? () => formRef.current?.requestSubmit() : undefined
    });
  }, [selectedProduct, submitting]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedProduct) {
      setError("The AI notes PDF product is not available right now.");
      return;
    }

    if (!file) {
      setError("Please select your payment screenshot.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onUpload(file, selectedProduct._id, activePaymentRoute?.key);
      setFile(null);
      event.target.reset();
    } catch (uploadError) {
      triggerNotification("error");
      setError(uploadError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="motion-card glass glass-wallet rounded-[32px] border-amber-400/12 px-6 py-[26px] shadow-[0_18px_40px_rgba(2,6,23,0.28)]" style={{ "--delay": "40ms" }}>
        <p className="text-[13px] font-medium text-white/55">Wallet Checkout</p>
        <h2 className="mt-3 text-[34px] font-semibold leading-none text-amber-50">Rs.{notePrice}</h2>
        <p className="mt-2.5 text-[13px] text-white/58">Use Wallet to complete payment, upload your screenshot proof, and unlock the AI Master Notes PDF.</p>
      </section>

      <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22),0_0_0_1px_rgba(34,211,238,0.06)] backdrop-blur-xl" style={{ "--delay": "150ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Deposit checkout</p>
            <p className="mt-2 text-[13px] text-white/58">Scan the QR for Rs.{notePrice}, then upload your payment proof to unlock the AI Master Notes PDF.</p>
          </div>
          <div className="rounded-full border border-cyan-300/18 bg-gradient-to-r from-accentBlue/14 to-accentCyan/14 px-3 py-1 text-xs font-medium text-cyan-100 shadow-[0_8px_18px_rgba(34,211,238,0.08)]">
            Wallet checkout
          </div>
        </div>

        {selectedProduct ? (
          <div className="mt-4 rounded-[22px] border border-cyan-400/12 bg-cyan-400/[0.05] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-white/86">Deposit option {selectedOptionIndex || 1}</p>
                <p className="mt-1 text-[12px] text-white/52">{activePaymentRoute ? `${activePaymentRoute.label} is live right now` : "Current AI notes checkout"}</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-semibold text-white">Rs.{notePrice}</p>
                <p className="mt-1 text-[11px] text-cyan-100/80">Selected amount</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {availableProducts.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => onDepositSelect(product._id)}
                  className={`rounded-full border px-3 py-2 text-[11px] font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 active:scale-[0.98] ${
                    String(selectedProduct._id) === String(product._id)
                      ? "border-cyan-300/22 bg-cyan-400/[0.14] text-cyan-100"
                      : "border-white/8 bg-white/[0.04] text-white/62"
                  }`}
                >
                  Option {availableProducts.findIndex((entry) => String(entry._id) === String(product._id)) + 1}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4 text-[13px] text-white/58">
            The AI notes PDF is not available to unlock right now.
          </div>
        )}
      </section>

      {selectedProduct ? (
        <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22),0_0_0_1px_rgba(34,211,238,0.06)] backdrop-blur-xl" style={{ "--delay": "190ms" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">Pay via UPI QR</p>
              <p className="mt-2 text-[13px] text-white/58">Selected amount: Rs.{selectedAmount}</p>
            </div>
            <div className="rounded-full border border-cyan-300/18 bg-gradient-to-r from-accentBlue/14 to-accentCyan/14 px-3 py-1 text-xs font-medium text-cyan-100 shadow-[0_8px_18px_rgba(34,211,238,0.08)]">
              Secure scan pay
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <SupportedUpiApps />
            {activePaymentRoute ? <PaymentQrCard label={activePaymentRoute.label} qrUrl={activePaymentRoute.qrUrl} amount={selectedAmount} /> : null}
          </div>
          <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4 text-[13px] text-white/60">
            {activePaymentRoute
              ? "Take a screenshot of this QR, complete your payment in any UPI app, and then upload the screenshot below as proof."
              : "A live payment route will appear here when checkout is ready."}
          </div>
        </section>
      ) : null}

      <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22),0_0_0_1px_rgba(34,211,238,0.06)] backdrop-blur-xl" style={{ "--delay": "230ms" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Payment proof</p>
            <p className="mt-2 text-[13px] text-white/58">Upload your payment screenshot here after completing the Rs.{notePrice} AI notes deposit.</p>
          </div>
          {user.hasPurchased ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : null}
        </div>

        {user.hasPurchased ? (
          <div className="mt-4 rounded-[22px] bg-emerald-500/10 px-4 py-4 text-[13px] text-emerald-300">
            Your AI notes purchase is active. Open Notes to download your PDF whenever you need it.
          </div>
        ) : null}

        <form ref={formRef} className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="motion-raise flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/14 bg-white/[0.04] px-4 py-8 text-center transition duration-200 active:scale-[0.99]">
            <UploadCloud className="h-7 w-7 text-accentCyan" />
            <span className="mt-3 text-sm text-white/75">{file ? file.name : "Upload screenshot"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <ActionButton type="submit" disabled={submitting || !selectedProduct} className="from-accentBlue to-accentCyan shadow-[0_14px_30px_rgba(34,211,238,0.22)]">
            {submitting ? "Submitting..." : "Submit Payment Proof"}
          </ActionButton>
        </form>
      </section>

      <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl" style={{ "--delay": "270ms" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Proof status history</p>
        <div className="mt-4 space-y-3">
          {(paymentHistory || []).slice(0, 6).map((item) => (
            <div key={item._id} className="motion-raise rounded-[22px] border border-cyan-400/10 bg-white/[0.04] px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-white/84">Deposit request</p>
                  <p className="mt-1 text-[12px] text-white/48">Submitted {new Date(item.createdAt).toLocaleString()}</p>
                  {item.reviewedAt ? <p className="mt-1 text-[12px] text-white/48">Reviewed {new Date(item.reviewedAt).toLocaleString()}</p> : null}
                </div>
                <span className={`status-pill rounded-full px-3 py-1 text-[11px] font-medium ${item.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : item.status === "rejected" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-200"}`}>
                  {item.status === "approved" ? "Approved" : item.status === "rejected" ? "Rejected" : "Under review"}
                </span>
              </div>
            </div>
          ))}
          {(!paymentHistory || paymentHistory.length === 0) ? <p className="text-[13px] text-white/55">Your deposit proof history will appear here.</p> : null}
        </div>
      </section>

      <section className="motion-card rounded-[24px] border border-amber-400/10 bg-white/[0.05] px-5 py-4.5 text-[13px] text-white/58 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl" style={{ "--delay": "310ms" }}>
        Payment proofs are reviewed in order. Once approved, your notes unlock and the PDF becomes available in Notes and in your Telegram bot chat.
      </section>
    </div>
  );
}
