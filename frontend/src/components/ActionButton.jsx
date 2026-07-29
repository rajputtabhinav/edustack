export function ActionButton({ children, className = "", ...props }) {
  return (
    <button
      className={`motion-raise w-full rounded-full bg-gradient-to-r from-accent to-accentSecondary px-5 py-3.5 text-[13px] font-semibold text-white transition duration-200 active:scale-[0.98] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_14px_30px_rgba(15,118,110,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-app ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
