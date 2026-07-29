import { Bell, CheckCircle2, MessageCircleMore, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { IconActionButton } from "../components/IconActionButton";

function NotificationItem({ item }) {
  return (
    <div className="motion-raise rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-white/88">{item.title}</p>
          <p className="mt-1 text-[12px] leading-5 text-white/58">{item.message}</p>
        </div>
        {!item.readAt ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300" /> : null}
      </div>
      <p className="mt-2 text-[11px] text-white/40">{new Date(item.createdAt).toLocaleString()}</p>
    </div>
  );
}

function HistoryStatus({ item }) {
  const label = item.status === "pending" ? "Under review" : item.status === "approved" ? "Approved" : "Rejected";
  return (
    <div className="motion-raise rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-white/82">{item.product?.name || "Deposit request"}</p>
          <p className="mt-1 text-[12px] text-white/45">Submitted {new Date(item.createdAt).toLocaleString()}</p>
        </div>
        <span className={`status-pill rounded-full px-3 py-1 text-[11px] font-medium ${label === "Approved" ? "bg-emerald-500/15 text-emerald-300" : label === "Rejected" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-200"}`}>{label}</span>
      </div>
    </div>
  );
}

export function DashboardPage({ user, config, notifications, paymentHistory, purchases, products, onDepositSelect, onDownload, onSendToChat }) {
  const notePrice = config.notePrice || 199;
  const latestNotifications = (notifications || []).slice(0, 4);
  const latestPaymentRequests = (paymentHistory || []).slice(0, 3);
  const purchasedVault = (purchases || []).slice(0, 4);
  const purchasedProductIds = new Set((purchases || []).map((purchase) => String(purchase.product?._id || purchase.product)));
  const nextUnlockProduct = (products || []).find((product) => !purchasedProductIds.has(String(product._id))) || products?.[0] || null;

  return (
    <div className="space-y-6">
      <section className="motion-card glass glass-home rounded-[32px] border-emerald-400/12 px-6 py-[26px] shadow-[0_18px_40px_rgba(2,6,23,0.28)]" style={{ "--delay": "40ms" }}>
        <p className="text-[13px] font-medium text-white/55">AI Master Notes</p>
        <p className="mt-3 text-[34px] font-semibold leading-none">Rs.{notePrice}</p>
        <p className="mt-2.5 text-[13px] text-white/58">Unlock the 351-page AI notes PDF, upload your payment proof, and access the file whenever you need it.</p>
        <div className="mt-5 inline-flex rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/64">
          {user.hasPurchased ? "Purchase active" : "Purchase required"}
        </div>
      </section>

      <div className="motion-card" style={{ "--delay": "110ms" }}>
        <Link
          to="/wallet"
          onClick={() => {
            if (nextUnlockProduct) {
              onDepositSelect(nextUnlockProduct._id);
            }
          }}
          className="motion-raise block w-full rounded-full bg-gradient-to-r from-accent to-accentSecondary px-5 py-3.5 text-center text-[13px] font-semibold text-white shadow-[0_14px_30px_rgba(15,118,110,0.28)] transition duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-app active:scale-[0.98]"
        >
          {user.hasPurchased ? "Open Wallet" : `Open Wallet Rs.${notePrice}`}
        </Link>
        <div className="mt-4 space-y-1.5 text-[13px] text-white/62">
          <p>351 pages of premium AI study material</p>
          <p>Worth Rs.5000, available for only Rs.{notePrice}</p>
          <p>Screenshot-first payment proof flow inside Wallet</p>
        </div>
      </div>

      <section className="motion-card grid grid-cols-2 gap-3" style={{ "--delay": "170ms" }}>
        <IconActionButton
          icon={Wallet}
          label="Wallet"
          to="/wallet"
          className="border-amber-400/12 bg-amber-400/[0.04] shadow-[0_14px_28px_rgba(146,64,14,0.12)]"
          iconWrapperClassName="border-amber-400/18 bg-amber-400/[0.1]"
          iconClassName="text-amber-200"
          labelClassName="text-amber-100/82"
        />
        <IconActionButton
          icon={Bell}
          label="Notes"
          to="/buy-notes"
          className="border-cyan-400/12 bg-cyan-400/[0.04] shadow-[0_14px_28px_rgba(34,211,238,0.12)]"
          iconWrapperClassName="border-cyan-400/18 bg-cyan-400/[0.1]"
          iconClassName="text-cyan-200"
          labelClassName="text-cyan-100/82"
        />
      </section>

      <section className="motion-card rounded-[28px] border border-cyan-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl" style={{ "--delay": "240ms" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-white/42">AI notes access vault</p>
        <div className="mt-4 grid gap-3">
          {purchasedVault.length ? (
            purchasedVault.map((purchase) => (
              <div key={purchase._id} className="motion-raise rounded-[22px] border border-cyan-400/10 bg-white/[0.04] px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-white/85">{purchase.product?.name}</p>
                    <p className="mt-1 text-[12px] text-white/50">{purchase.product?.fileSizeLabel || purchase.product?.category}</p>
                  </div>
                  {purchase.product?.downloadReady ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSendToChat?.(purchase.product._id)}
                        className="status-pill inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-100"
                      >
                        <MessageCircleMore className="h-3.5 w-3.5" />
                        In Bot
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownload?.(purchase.product._id)}
                        className="status-pill rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-100"
                      >
                        Download PDF
                      </button>
                    </div>
                  ) : (
                    <span className="status-pill rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-100">Unlocked</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-white/55">Your unlocked notes will appear here after payment approval.</p>
          )}
        </div>
      </section>

      <section className="motion-card rounded-[28px] border border-white/10 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl" style={{ "--delay": "300ms" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Requests and alerts</p>
        <div className="mt-4 space-y-3">
          {latestPaymentRequests.map((item) => (
            <HistoryStatus key={item._id} item={item} />
          ))}
          {latestNotifications.map((item) => (
            <NotificationItem key={item._id} item={item} />
          ))}
          {latestPaymentRequests.length === 0 && latestNotifications.length === 0 ? (
            <p className="text-[13px] text-white/55">Your payment updates and product alerts will appear here.</p>
          ) : null}
        </div>
      </section>

      {user.hasPurchased ? (
        <section className="motion-card rounded-[24px] border border-emerald-400/10 bg-emerald-500/10 px-5 py-4.5 text-[13px] text-emerald-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl" style={{ "--delay": "360ms" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Your purchase is active. Open Notes to access the PDF anytime.
          </div>
        </section>
      ) : null}
    </div>
  );
}
