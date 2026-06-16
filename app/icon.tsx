import { ImageResponse } from "next/og";

// Tab-icon (favicon). Renders the same ETH-style diamond as the header logo
// so the browser tab matches the brand. 32x32 — Chrome/Safari auto-scale.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0e1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={28} height={28} viewBox="0 0 32 32">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bff" />
              <stop offset="60%" stopColor="#7c5cff" />
              <stop offset="100%" stopColor="#5b8dee" />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5b3df0" />
              <stop offset="100%" stopColor="#1f1547" />
            </linearGradient>
          </defs>
          <polygon points="16,2 4,17 16,12" fill="url(#g1)" />
          <polygon points="16,2 28,17 16,12" fill="url(#g2)" />
          <polygon points="4,19 16,14 16,30" fill="url(#g1)" opacity="0.85" />
          <polygon points="28,19 16,14 16,30" fill="url(#g2)" opacity="0.85" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
