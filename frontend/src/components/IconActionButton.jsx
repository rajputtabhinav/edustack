import { Link } from "react-router-dom";

const baseClassName =
  "motion-raise flex flex-col items-center gap-2.5 rounded-[22px] border border-white/8 bg-white/[0.04] px-3 py-3.5 text-center transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55";

export function IconActionButton({
  icon: Icon,
  label,
  locked = false,
  onClick,
  className = "",
  iconWrapperClassName = "",
  iconClassName = "",
  labelClassName = "",
  type = "button",
  to
}) {
  const content = (
    <>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] ${iconWrapperClassName}`}>
        <Icon className={`h-4.5 w-4.5 text-white/80 ${iconClassName}`} />
      </span>
      <span className={`text-[11px] font-medium text-white/75 ${labelClassName}`}>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={locked}
      className={`${baseClassName} ${className}`}
    >
      {content}
    </button>
  );
}
