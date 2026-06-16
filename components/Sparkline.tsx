import { Snapshot, weiToNumber } from "@/lib/stakewise";

// Returns the snapshots inside the last `days` window. Used by both the
// Sparkline (for plotting) and PositionRow (for the explicit "+X / 30d" label)
// so the math stays in one place.
export function snapshotsWindowed(snapshots: Snapshot[], days: number): Snapshot[] {
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
  return (snapshots ?? []).filter((s) => s.timestamp >= cutoff);
}

export function sumEarnedWei(snapshots: Snapshot[]): bigint {
  let s = 0n;
  for (const p of snapshots) s += p.earnedAssets;
  return s;
}

// Inline SVG sparkline of CUMULATIVE earned-assets within the visible window.
// Pure presentational; the label "+X ETH ($Y) in 30d" lives in PositionRow.
export function Sparkline({ snapshots, days = 30 }: { snapshots: Snapshot[]; days?: number }) {
  if (!snapshots || snapshots.length < 2) {
    return <div className="text-[11px] text-dim italic">no history yet</div>;
  }
  const inWindow = snapshotsWindowed(snapshots, days);
  if (inWindow.length < 2) {
    return <div className="text-[11px] text-dim italic">{days}d history pending</div>;
  }

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
  const W = 140;
  const H = 32;
  const path = points
    .map((p, i) => {
      const x = ((p.t - xMin) / xRange) * (W - 2) + 1;
      const y = H - 2 - ((p.y - yMin) / yRange) * (H - 4);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = H - 2 - ((ys[ys.length - 1] - yMin) / yRange) * (H - 4);
  const lastX = ((xs[xs.length - 1] - xMin) / xRange) * (W - 2) + 1;
  const stroke = "#2dd4bf";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-[140px]" aria-label={`${days}-day cumulative earnings`}>
      <defs>
        <linearGradient id="sg-cum" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${W - 1} ${H} L 1 ${H} Z`} fill="url(#sg-cum)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2} fill={stroke} />
    </svg>
  );
}
