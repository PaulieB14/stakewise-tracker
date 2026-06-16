import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "StakeWise Tracker — every vault, one view";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Root-level OG card. Static brand design (vs. the wallet view which renders
// per-address stats). Premium-tier aesthetic: ETH-style diamond hero, gradient
// aurora bg, mocked-up dashboard stats glanceable in the corner.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse at top left, rgba(124,92,255,0.45) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(45,212,191,0.3) 0%, transparent 55%), linear-gradient(135deg, #0a0e1a 0%, #1a1330 100%)",
          padding: 72,
          color: "#e6ecf5",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top row: logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Diamond />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>StakeWise Tracker</div>
          <div style={{ fontSize: 20, color: "#aab6cc", marginLeft: 8 }}>multi-vault · multi-network</div>
        </div>

        {/* Hero headline */}
        <div style={{ marginTop: 80, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -3,
              backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c9b8ff 45%, #7c5cff 80%, #2dd4bf 100%)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
            }}
          >
            Every vault.
          </div>
          <div
            style={{
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -3,
              marginTop: 4,
              backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c9b8ff 45%, #7c5cff 80%, #2dd4bf 100%)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
            }}
          >
            One view.
          </div>
          <div style={{ marginTop: 24, fontSize: 28, color: "#aab6cc", display: "flex" }}>
            Multi-vault dashboard for StakeWise V3 stakers. Mainnet + Gnosis.
          </div>
        </div>

        {/* Bottom row: mock stats + URL */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", gap: 24 }}>
            <Stat label="VAULTS" value="all" />
            <Stat label="CHAINS" value="2" />
            <Stat label="CONNECT" value="none" accent />
            <Stat label="STORED" value="zero" accent />
          </div>
          <div style={{ fontSize: 22, color: "#8693b0", fontFamily: "monospace" }}>
            stakewise-tracker.vercel.app
          </div>
        </div>

        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            top: -100,
            right: -200,
            background: "radial-gradient(circle, rgba(124,92,255,0.35), transparent 70%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

function Diamond() {
  return (
    <svg width="48" height="48" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="d1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bff" />
          <stop offset="60%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#5b8dee" />
        </linearGradient>
        <linearGradient id="d2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b3df0" />
          <stop offset="100%" stopColor="#1f1547" />
        </linearGradient>
      </defs>
      <polygon points="16,2 4,17 16,12" fill="url(#d1)" />
      <polygon points="16,2 28,17 16,12" fill="url(#d2)" />
      <polygon points="4,19 16,14 16,30" fill="url(#d1)" opacity="0.85" />
      <polygon points="28,19 16,14 16,30" fill="url(#d2)" opacity="0.85" />
    </svg>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "14px 22px",
        borderRadius: 14,
        background: "rgba(28, 38, 60, 0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 13, color: "#8693b0", letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent ? "#2dd4bf" : "#e6ecf5", marginTop: 4 }}>{value}</div>
    </div>
  );
}
