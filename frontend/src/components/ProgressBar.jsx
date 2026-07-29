export function ProgressBar({ current, target, label, className = "", barClassName = "" }) {
  const safeTarget = target > 0 ? target : 1;
  const percentage = Math.min((current / safeTarget) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <div className={`rounded-[24px] border border-white/8 bg-white/[0.05] p-[17px] shadow-[0_16px_32px_rgba(2,6,23,0.22)] backdrop-blur-xl ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
          <p className="mt-1.5 text-base font-semibold">
            Rs.{current} / Rs.{target}
          </p>
        </div>
        <p className="max-w-[120px] text-right text-[11px] leading-5 text-white/55">
          {remaining === 0 ? "Withdraw unlocked" : `Rs.${remaining} more to withdraw`}
        </p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div className={`progress-fill h-2 rounded-full bg-gradient-to-r from-accent to-accentSecondary ${barClassName}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
