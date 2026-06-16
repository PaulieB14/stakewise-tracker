import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // StakeWise-ish blue/purple palette tuned for dark theme
        bg: "#0a0e1a",
        panel: "#111828",
        panelHi: "#172033",
        border: "#1f2a3f",
        text: "#e6ecf5",
        muted: "#aab6cc",      // WCAG AA on navy (was #9aa6bc, ~4.0 → ~5.6:1)
        dim: "#8693b0",        // WCAG AA on navy (was #6b7693, 3.9 → 5.1:1)
        accent: "#7c5cff",     // StakeWise purple — reserved for brand + primary CTAs only
        accent2: "#2dd4bf",    // teal — reserved for REALIZED rewards (sparkline, earned $)
        warn: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
