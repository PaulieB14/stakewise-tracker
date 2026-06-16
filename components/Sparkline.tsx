import { Snapshot, weiToNumber } from "@/lib/stakewise";

// Inline SVG sparkline of CUMULATIVE earned-assets over the last N days.
// AllocatorSnapshot.earnedAssets is per-period (1 day's rewards) — to make
// the line grow visually like users expect, we sum forward through the
// window. Server-rendered, no client JS at render time.
export function Sparkline({ snapshots, days = 30 }: { snapshots: Snapshot[]; days?: number }) {
  if (!snapshots || snapshots.length < 2) {
    return <div className="text-[10px] text-dim italic">no history yet</div>;
  }
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
  const inWindow = snapshots.filter((s) => s.timestamp >= cutoff);
  if (inWindow.length < 2) {
    return <div className="text-[10px] text-dim italic">{days}d history pending</div>;
  }

  // Snapshots are oldest -> newest already; build cumulative running sum so
  // the chart shows total earnings within the visible window.
  let runningSum = 0;
  const points = inWindow.map((p) => {
    runningSum += weiToNumber(p.earnedAssets);
    return { t: p.timestamp, y: runningSum };
  });

  const xs = points.map((p) => p.t);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yRange = yMax - yMin || 1;
  const xRange = xMax - xMin || 1;
  const W = 120;
  const H = 30;
  const path = points
    .map((p, i) => {
      const x = ((p.t - xMin) / xRange) * (W - 2) + 1;
      const y = H - 2 - ((p.y - yMin) / yRange) * (H - 4);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = H - 2 - ((ys[ys.length - 1] - yMin) / yRange) * (H - 4);
  const lastX = ((xs[xs.length - 1] - xMin) / xRange) * (W - 2) + 1;

  // Cumulative is monotonically non-decreasing, so always "up" colored.
  const stroke = "#2dd4bf";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-6 w-[120px]" aria-label={`${days}-day cumulative earnings`}>
      <defs>
        <linearGradient id="sg-cum" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${W - 1} ${H} L 1 ${H} Z`} fill="url(#sg-cum)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={1.6} fill={stroke} />
    </svg>
  );
}
