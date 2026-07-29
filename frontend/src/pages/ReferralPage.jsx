import { Lock, MessageCircleMore, Send, Share2 } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { openExternalUrl, triggerImpact } from "../lib/telegram";

const timelineLabel = {
  joined: "Joined",
  join_bonus_credited: "Join bonus credited",
  purchased: "Purchased",
  reward_credited: "Reward credited"
};

export function ReferralPage({ user, referrals, config, onCopy }) {
  const locked = !user.hasPurchased;
  const referralReward = config.bonus?.currentReward || config.referralReward || 40;
  const referralJoinBonus = config.referralJoinBonus || 10;
  const shareTemplates = config.shareTemplates || {};
  const totalPerReferral = referralJoinBonus + referralReward;

  function openShareChannel(channel) {
    if (locked) {
      return;
    }

    const message = shareTemplates[channel];
    if (!message) {
      return;
    }

    triggerImpact("light");

    if (channel === "telegram") {
      openExternalUrl(`https://t.me/share/url?url=${encodeURIComponent(user.referralLink)}&text=${encodeURIComponent(message)}`);
      return;
    }

    openExternalUrl(`https://wa.me/?text=${encodeURIComponent(message)}`);
  }

  return (
    <div className="space-y-6">
      <section className="motion-card glass glass-refer rounded-[32px] border-violet-400/12 px-6 py-[26px] shadow-[0_18px_40px_rgba(2,6,23,0.28)]" style={{ "--delay": "40ms" }}>
        <p className="text-[13px] font-medium text-white/55">Referral Rewards</p>
        <h2 className="mt-3 text-[26px] font-semibold leading-tight">Earn up to Rs.{totalPerReferral} per referral</h2>
        <p className="mt-2.5 text-[13px] text-white/58">You get Rs.{referralJoinBonus} when they join through your link, then Rs.{referralReward} more after their first approved purchase.</p>
      </section>

      <section className="motion-card rounded-[28px] border border-violet-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22),0_0_0_1px_rgba(139,92,246,0.06)] backdrop-blur-xl" style={{ "--delay": "110ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Your invite link</p>
            <p className="mt-3 break-all text-sm leading-6 text-white/82">
              {locked ? "Complete your Rs.99 notes purchase to activate your invite link." : user.referralLink}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-400/16 bg-gradient-to-br from-accentIndigo/18 to-accentViolet/18 shadow-[0_10px_20px_rgba(99,102,241,0.12)]">
            <Share2 className="h-5 w-5 text-violet-200" />
          </span>
        </div>
        <div className="mt-5">
          <ActionButton onClick={() => onCopy(user.referralLink)} disabled={locked} className="from-accentIndigo to-accentViolet shadow-[0_14px_30px_rgba(99,102,241,0.24)]">
            {locked ? "Available After Purchase" : "Copy Invite Link"}
          </ActionButton>
        </div>
      </section>

      <section className="motion-card grid grid-cols-2 gap-3" style={{ "--delay": "180ms" }}>
        <div className="motion-raise rounded-[24px] border border-violet-400/12 bg-white/[0.05] px-4 py-5 shadow-[0_14px_28px_rgba(2,6,23,0.2),0_0_0_1px_rgba(99,102,241,0.05)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Total referrals</p>
          <p className="mt-2.5 text-[28px] font-semibold">{referrals.referralCount}</p>
        </div>
        <div className="motion-raise rounded-[24px] border border-violet-400/12 bg-white/[0.05] px-4 py-5 shadow-[0_14px_28px_rgba(2,6,23,0.2),0_0_0_1px_rgba(139,92,246,0.05)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Total earned</p>
          <p className="mt-2.5 text-[28px] font-semibold text-violet-200">Rs.{user.totalReferralEarnings || 0}</p>
        </div>
      </section>

      <section className="motion-card grid grid-cols-2 gap-3" style={{ "--delay": "220ms" }}>
        <div className="motion-raise rounded-[24px] border border-violet-400/12 bg-white/[0.05] px-4 py-5 shadow-[0_14px_28px_rgba(2,6,23,0.2)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Join bonuses</p>
          <p className="mt-2.5 text-[24px] font-semibold">{referrals.analytics?.joinBonusCredited || 0}</p>
        </div>
        <div className="motion-raise rounded-[24px] border border-violet-400/12 bg-white/[0.05] px-4 py-5 shadow-[0_14px_28px_rgba(2,6,23,0.2)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Conversion</p>
          <p className="mt-2.5 text-[24px] font-semibold text-violet-200">{referrals.analytics?.conversionRate || 0}%</p>
        </div>
      </section>

      <section className="motion-card rounded-[24px] border border-violet-400/12 bg-white/[0.05] px-4 py-4 text-[13px] text-white/58 shadow-[0_14px_28px_rgba(2,6,23,0.18),0_0_0_1px_rgba(99,102,241,0.05)] backdrop-blur-xl" style={{ "--delay": "250ms" }}>
        <p className="font-medium text-white/78">Per referral math: Rs.{referralJoinBonus} on join + Rs.{referralReward} after purchase = Rs.{totalPerReferral} total.</p>
        <p className="mt-2 text-[12px] text-white/54">Use the share buttons below to open Telegram or WhatsApp with your referral message and link already filled in.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => openShareChannel("telegram")}
            disabled={locked}
            className={`motion-raise inline-flex items-center justify-center gap-2 rounded-full border border-violet-400/14 bg-gradient-to-r from-accentIndigo/18 to-accentViolet/18 px-4 py-3 text-[12px] font-semibold text-white shadow-[0_12px_24px_rgba(99,102,241,0.16)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 active:scale-[0.98] ${locked ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Send className="h-4 w-4" />
            Share on Telegram
          </button>
          <button
            type="button"
            onClick={() => openShareChannel("whatsapp")}
            disabled={locked}
            className={`motion-raise inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/14 bg-gradient-to-r from-emerald-500/18 to-emerald-400/18 px-4 py-3 text-[12px] font-semibold text-white shadow-[0_12px_24px_rgba(16,185,129,0.16)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 active:scale-[0.98] ${locked ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <MessageCircleMore className="h-4 w-4" />
            Share on WhatsApp
          </button>
        </div>
      </section>

      <section className="motion-card rounded-[28px] border border-violet-400/12 bg-white/[0.05] px-5 py-5 shadow-[0_16px_32px_rgba(2,6,23,0.22),0_0_0_1px_rgba(99,102,241,0.05)] backdrop-blur-xl" style={{ "--delay": "320ms" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Referral activity</p>
        <div className="mt-4 space-y-3">
          {referrals.referrals.map((entry) => (
            <div key={entry.telegramId} className="motion-raise flex items-center justify-between rounded-[22px] border border-violet-400/10 bg-white/[0.04] px-4 py-3.5 shadow-[0_10px_22px_rgba(67,56,202,0.08)]">
              <div>
                <p className="font-medium">{entry.firstName || entry.username || entry.telegramId}</p>
                <p className="mt-1 text-xs text-white/42">{new Date(entry.createdAt).toLocaleDateString()}</p>
                <p className="mt-1 text-xs text-violet-200/90">{timelineLabel[entry.timelineStatus] || "Joined"}</p>
              </div>
              <span className={`status-pill rounded-full px-3 py-1 text-xs font-medium ${entry.hasPurchased ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                {entry.rewardGrantedForReferral ? "Reward credited" : entry.hasPurchased ? "Purchased" : "Joined"}
              </span>
            </div>
          ))}
          {referrals.referrals.length === 0 ? (
            <div className="rounded-[22px] bg-white/[0.04] px-4 py-4 text-sm text-white/55">
              {locked ? (
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Buy your Rs.{config.notePrice || 199} notes to unlock referral rewards.
                </span>
              ) : (
                "No referrals yet. Share your invite link to start earning."
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
