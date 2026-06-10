import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0F14",
        surface: "#161920",
        border: "#252A35",
        primary: "#4F8EF7",
        success: "#34D399",
        warning: "#FBBF24",
        danger: "#F87171",
        "text-primary": "#F1F5F9",
        "text-muted": "#64748B",
      },
      fontFamily: {
        display: ["var(--font-rajdhani)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
