import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0F19",
          card: "#1E293B",
          card2: "#162033",
        },
        gold: {
          DEFAULT: "#FACC15",
          dark: "#ca8a04",
        },
        accent: "#3B82F6",
        muted: "#94A3B8",
        border: "#2D3F5A",
        sentiment: {
          positive: "#22C55E",
          neutral: "#FACC15",
          negative: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      animation: {
        ticker: "ticker 30s linear infinite",
        pulse_slow: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #080d1a 0%, #0f0520 50%, #080d1a 100%)",
        "grid-pattern":
          "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-size": "50px 50px",
      },
    },
  },
  plugins: [],
};

export default config;