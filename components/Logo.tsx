// ETH-style isometric diamond, hand-tuned SVG. Used in the header and OG image.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="eth-grad-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bff" />
          <stop offset="60%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#5b8dee" />
        </linearGradient>
        <linearGradient id="eth-grad-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b3df0" />
          <stop offset="100%" stopColor="#1f1547" />
        </linearGradient>
      </defs>
      {/* Top-left face */}
      <polygon points="16,2 4,17 16,12" fill="url(#eth-grad-light)" />
      {/* Top-right face */}
      <polygon points="16,2 28,17 16,12" fill="url(#eth-grad-dark)" />
      {/* Bottom-left face */}
      <polygon points="4,19 16,14 16,30" fill="url(#eth-grad-light)" opacity="0.85" />
      {/* Bottom-right face */}
      <polygon points="28,19 16,14 16,30" fill="url(#eth-grad-dark)" opacity="0.85" />
      {/* Subtle teal highlight on the equator */}
      <line x1="4" y1="17.5" x2="28" y2="17.5" stroke="#2dd4bf" strokeWidth="0.5" opacity="0.35" />
    </svg>
  );
}
