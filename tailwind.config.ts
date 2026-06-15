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
        muted: "#9aa6bc",
        dim: "#6b7693",
        accent: "#7c5cff",     // StakeWise purple
        accent2: "#2dd4bf",    // teal for positive numbers
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
