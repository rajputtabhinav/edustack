export function InfoCard({ title, value, hint, accent = false }) {
  return (
    <div
      className={`rounded-[24px] border border-white/8 bg-card p-4 shadow-[0_12px_32px_rgba(2,6,23,0.25)] ${
        accent ? "bg-gradient-to-br from-accent/18 to-accentSecondary/14" : ""
      }`}
    >
      <p className="text-sm text-white/60">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}
