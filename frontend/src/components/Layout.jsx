import { BadgeCheck, CreditCard, Home, Wallet } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: Home, activeClass: "from-accent to-accentSecondary shadow-[0_10px_24px_rgba(15,118,110,0.22)]" },
  { to: "/buy-notes", label: "Notes", icon: CreditCard, activeClass: "from-accentBlue to-accentCyan shadow-[0_10px_24px_rgba(34,211,238,0.2)]" },
  { to: "/wallet", label: "Wallet", icon: Wallet, activeClass: "from-accentAmber to-accentGold shadow-[0_10px_24px_rgba(245,158,11,0.2)]" }
];

export function Layout({ user, children, toast }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-app text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-6">
        <header className="motion-card rounded-[28px] border border-white/8 bg-white/[0.05] px-[22px] py-[22px] shadow-[0_18px_40px_rgba(2,6,23,0.26)] backdrop-blur-xl" style={{ "--delay": "30ms" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">EduStack</p>
              <div className="mt-2 flex items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-none">
                  {user?.greetingName ? `Hi, ${user.greetingName}` : "Hi"}
                </h1>
                {user?.verifiedBadge ? (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_10px_18px_rgba(59,130,246,0.28)] ring-1 ring-sky-200/30"
                    aria-label="Verified paid user"
                    title="Verified paid user"
                  >
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2 text-right backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Status</p>
              <p className="mt-1 text-[13px] font-medium">{user?.statusBadge || "Loading..."}</p>
              {user?.verifiedBadge ? <p className="mt-1 text-[11px] text-emerald-200">Verified paid user</p> : null}
            </div>
          </div>
        </header>

        <main key={location.pathname} className="page-enter mt-6 flex-1">
          {children}
        </main>

        {toast ? (
          <div className="toast-enter fixed bottom-28 left-1/2 z-30 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 rounded-full border border-white/10 bg-[#101826]/95 px-4 py-3 text-center text-sm font-medium text-white shadow-[0_16px_30px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            {toast}
          </div>
        ) : null}

        <nav className="fixed bottom-4 left-1/2 z-20 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 grid-cols-3 gap-1 rounded-[28px] border border-white/10 bg-[#0f1726]/92 px-2 py-2 shadow-[0_22px_44px_rgba(2,6,23,0.45)] backdrop-blur-xl" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
          {navItems.map(({ to, label, icon: Icon, activeClass }) => {
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center rounded-2xl px-2 py-2 text-[10px] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-app ${
                    isActive ? `nav-active-enter bg-gradient-to-r ${activeClass} text-white` : "text-white/58"
                  }`
                }
              >
                <Icon className={`mb-1 h-3.5 w-3.5 transition duration-200 ${location.pathname === to ? "scale-[1.06]" : ""}`} />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
