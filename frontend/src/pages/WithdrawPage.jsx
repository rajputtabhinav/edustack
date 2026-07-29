import { useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton";
import { configureMainButton, openExternalUrl, triggerNotification } from "../lib/telegram";

export function WithdrawPage({ user, config, pendingWithdrawal, pendingWithdrawals, withdrawalHistory, payoutEstimate, onRequest }) {
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  const canWithdraw = user.hasPurchased && user.availableBalance >= config.minWithdrawal && !pendingWithdrawal;
  const helperText = useMemo(() => {
    if (!user.hasPurchased) {
      return "Complete a purchase to unlock withdrawals.";
    }
    if (user.availableBalance < config.minWithdrawal) {
      return `You need Rs.${config.minWithdrawal - user.availableBalance} more before withdrawing.`;
    }
    return "";
  }, [config.minWithdrawal, user.availableBalance, user.hasPurchased]);

  useEffect(() => {
    return configureMainButton({
      text: loading ? "Submitting..." : "Request Withdrawal",
      isVisible: true,
      isEnabled: canWithdraw && !loading,
      isLoading: loading,
      onClick: canWithdraw ? () => formRef.current?.requestSubmit() : undefined
    });
  }, [canWithdraw, loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onRequest({
        amount: Number(amount),
        upiId
      });
      setAmount("");
      setUpiId("");
    } catch (requestError) {
      triggerNotification("error");
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="motion-card glass glass-wallet rounded-[32px] border-amber-400/12 px-6 py-[26px] shadow-[0_18px_40px_rgba(2,6,23,0.28)]" style={{ "--delay": "40ms" }}>
        <p className="text-[13px] font-medium text-white/55">Withdraw Funds</p>
        <h2 className="mt-3 text-[26px] font-semibold leading-tight">Withdraw from Rs.{config.minWithdrawal}</h2>
        <p className="mt-2.5 text-[13px] text-white/58">Withdrawals unlock after your wallet reaches Rs.{config.minWithdrawal}. Payouts are sent manually to your UPI ID after approval.</p>
      </section>

      <section className="motion-card grid grid-cols-3 gap-3" style={{ "--delay": "110ms" }}>
        <div className="motion-raise rounded-[24px] border border-amber-400/12 bg-white/[0.05] px-4 py-5 text-center shadow-[0_14px_28px_rgba(2,6,23,0.2),0_0_0_1px_rgba(245,158,11,0.05)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Available</p>
          <p className="mt-2.5 text-[13px] font-semibold">Rs.{user.availableBalance}</p>
        </div>
        <div className="motion-raise rounded-[24px] border border-amber-400/12 bg-white/[0.05] px-4 py-5 text-center shadow-[0_14px_28px_rgba(2,6,23,0.2),0_0_0_1px_rgba(245,158,11,0.05)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Pending</p>
          <p className="mt-2.5 text-[13px] font-semibold">{pendingWithdrawals.length}</p>
        </div>
        <div className="motion-raise rounded-[24px] border border-amber-400/12 bg-white/[0.05] px-4 py-5 text-center shadow-[0_14px_28px_rgba(2,6,23,0.2),0_0_0_1px_rgba(245,158,11,0.05)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Locked</p>
          <p className="mt-2.5 text-[13px] font-semibold">Rs.{user.lockedBalance || 0}</p>
        </div>
      </section>

      <section className="motion-card rounded-[28px] border border-amber-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22),0_0_0_1px_rgba(245,158,11,0.05)] backdrop-blur-xl" style={{ "--delay": "190ms" }}>
        {pendingWithdrawal ? (
          <div className="motion-raise rounded-[22px] bg-amber-500/10 px-4 py-4 text-[13px] text-amber-300">
            Your withdrawal request for Rs.{pendingWithdrawal.amount} is in progress.
            <p className="mt-2 text-[12px] text-amber-100/80">{payoutEstimate?.label}</p>
            {payoutEstimate?.expectedBy ? <p className="mt-1 text-[12px] text-amber-100/70">Expected by {new Date(payoutEstimate.expectedBy).toLocaleString()}</p> : null}
          </div>
        ) : (
          <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">Minimum withdrawal</p>
              <p className="mt-1.5 text-base font-semibold">Rs.{config.minWithdrawal}</p>
              {helperText ? <p className="mt-2 text-[13px] text-white/58">{helperText}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-[13px] text-white/60">Payout UPI ID</label>
              <input
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[13px] text-white outline-none transition duration-200 focus:border-amber-300/30"
                placeholder="yourupi@bank"
                type="text"
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] text-white/60">Withdrawal amount</label>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[13px] text-white outline-none transition duration-200 focus:border-amber-300/30"
                placeholder="Enter amount"
                type="number"
                min={config.minWithdrawal}
                max={user.availableBalance}
              />
            </div>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <ActionButton
              type="submit"
              disabled={loading || !canWithdraw}
              className="from-accentAmber to-accentGold shadow-[0_14px_30px_rgba(245,158,11,0.22)] focus-visible:ring-amber-300/80"
            >
              {loading ? "Submitting..." : "Request Withdrawal"}
            </ActionButton>
          </form>
        )}
      </section>

      <section className="motion-card rounded-[28px] border border-indigo-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl" style={{ "--delay": "220ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Extra value</p>
            <p className="mt-2 text-[13px] text-white/58">Subscribe to our Telegram channel for the most valuable AI content, updates, learning drops, and future study material.</p>
          </div>
          <div className="rounded-full border border-indigo-300/16 bg-indigo-400/[0.08] px-3 py-1 text-[11px] font-medium text-indigo-100">
            stackaiworld
          </div>
        </div>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => openExternalUrl("https://t.me/stackaiworld")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-indigo-300/16 bg-indigo-400/[0.08] px-4 py-3 text-[13px] font-semibold text-indigo-100 shadow-[0_12px_24px_rgba(79,70,229,0.14)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/80 active:scale-[0.98]"
          >
            Subscribe Channel
          </button>
        </div>
      </section>

      <section className="motion-card rounded-[28px] border border-amber-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl" style={{ "--delay": "250ms" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Withdrawal status history</p>
        <div className="mt-4 space-y-3">
          {(withdrawalHistory || []).slice(0, 6).map((item) => (
            <div key={item._id} className="motion-raise rounded-[22px] border border-amber-400/10 bg-white/[0.04] px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-white/84">Rs.{item.amount}</p>
                  <p className="mt-1 text-[12px] text-white/48">Submitted {new Date(item.createdAt).toLocaleString()}</p>
                  {item.processedAt ? <p className="mt-1 text-[12px] text-white/48">Processed {new Date(item.processedAt).toLocaleString()}</p> : null}
                </div>
                <span className={`status-pill rounded-full px-3 py-1 text-[11px] font-medium ${item.status === "paid" ? "bg-emerald-500/15 text-emerald-300" : item.status === "rejected" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-200"}`}>
                  {item.status === "paid" ? "Approved" : item.status === "rejected" ? "Rejected" : "Under review"}
                </span>
              </div>
            </div>
          ))}
          {(!withdrawalHistory || withdrawalHistory.length === 0) ? <p className="text-[13px] text-white/55">Your withdrawal status updates will appear here.</p> : null}
        </div>
      </section>
    </div>
  );
}
