const medals = {
  1: "\u{1F947}",
  2: "\u{1F948}",
  3: "\u{1F949}"
};

export function LeaderboardPage({ leaderboard }) {
  const entries = leaderboard?.entries ?? [];

  return (
    <div className="space-y-4">
      <section className="glass fintech-glow rounded-[28px] p-5 shadow-glass">
        <p className="text-sm text-white/60">Top earners</p>
        <h2 className="mt-2 text-2xl font-semibold">Leaderboard</h2>
        <p className="mt-2 text-sm text-white/55">Daily, weekly, and all-time competition drive stronger referral momentum.</p>
      </section>

      <section className="glass rounded-[28px] p-5 shadow-glass">
        <p className="text-sm text-white/60">All-time ranking</p>
        <div className="mt-4 space-y-3">
          {entries.map((entry) => (
            <div key={`${entry.telegramId}-${entry.rank}`} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="text-xl">{medals[entry.rank] || `#${entry.rank}`}</div>
                <div>
                  <p className="font-medium">{entry.displayName}</p>
                  <p className="text-xs text-white/45">@{entry.telegramId || "hidden"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-400">Rs.{entry.amount}</p>
                <p className="text-xs text-white/45">Referral earnings</p>
              </div>
            </div>
          ))}
          {entries.length === 0 ? <p className="text-sm text-white/50">Leaderboard will populate after referral rewards start landing.</p> : null}
        </div>
      </section>
    </div>
  );
}
