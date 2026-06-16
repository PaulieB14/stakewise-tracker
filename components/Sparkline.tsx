import { Snapshot, weiToNumber } from "@/lib/stakewise";

// Inline SVG sparkline of cumulative earned-assets over time.
// Pure presentational, no JS at render — server-rendered.
export function Sparkline({ snapshots, days = 30 }: { snapshots: Snapshot[]; days?: number }) {
  if (!snapshots || snapshots.length < 2) {
    return <div className="text-[10px] text-dim italic">no history yet</div>;
  }
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
  const points = snapshots.filter((s) => s.timestamp >= cutoff);
  if (points.length < 2) {
    return <div className="text-[10px] text-dim italic">{days}d history pending</div>;
  }

  const xs = points.map((p) => p.timestamp);
  const ys = points.map((p) => weiToNumber(p.earnedAssets));
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
      const x = ((p.timestamp - xMin) / xRange) * (W - 2) + 1;
      const y = H - 2 - ((weiToNumber(p.earnedAssets) - yMin) / yRange) * (H - 4);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = H - 2 - ((ys[ys.length - 1] - yMin) / yRange) * (H - 4);
  const lastX = ((xs[xs.length - 1] - xMin) / xRange) * (W - 2) + 1;

  const trend = ys[ys.length - 1] >= ys[0] ? "up" : "down";
  const stroke = trend === "up" ? "#2dd4bf" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-6 w-[120px]" aria-label={`${days}-day earnings trend`}>
      <defs>
        <linearGradient id={`sg-${trend}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${W - 1} ${H} L 1 ${H} Z`} fill={`url(#sg-${trend})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={1.6} fill={stroke} />
    </svg>
  );
}
