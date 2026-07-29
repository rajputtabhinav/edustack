/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: "#0B0F1A",
        card: "#111827",
        accent: "#0f766e",
        accentSecondary: "#34d399",
        accentCyan: "#22d3ee",
        accentBlue: "#38bdf8",
        accentIndigo: "#6366f1",
        accentViolet: "#8b5cf6",
        accentAmber: "#f59e0b",
        accentGold: "#fbbf24"
      },
      boxShadow: {
        glass: "0 20px 45px rgba(15, 23, 42, 0.45)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(16,185,129,0.12), transparent 32%), radial-gradient(circle at bottom right, rgba(20,184,166,0.1), transparent 28%)"
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        fadeUp: "fadeUp 0.6s ease forwards",
        pageFade: "pageFade 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        cardIn: "cardIn 0.52s cubic-bezier(0.22, 1, 0.36, 1) both",
        toastIn: "toastIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
        navSettle: "navSettle 0.34s cubic-bezier(0.22, 1, 0.36, 1) both"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pageFade: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        cardIn: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.985)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translate(-50%, 8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0) scale(1)" }
        },
        navSettle: {
          "0%": { transform: "translateY(2px) scale(0.97)", opacity: "0.72" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
};
