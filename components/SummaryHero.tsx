import { VaultPosition, formatAssets, nativeSymbol, weiToNumber } from "@/lib/stakewise";

function sumBy<T>(rows: T[], pick: (r: T) => bigint): bigint {
  return rows.reduce((a, r) => a + pick(r), 0n);
}

function weightedApy(rows: VaultPosition[]): number {
  let totalAssets = 0;
  let weighted = 0;
  for (const r of rows) {
    const a = weiToNumber(r.assets);
    totalAssets += a;
    weighted += a * r.apy;
  }
  return totalAssets > 0 ? weighted / totalAssets : 0;
}

export function SummaryHero({ positions }: { positions: VaultPosition[] }) {
  // Per-network sub-totals.
  const networks = Array.from(new Set(positions.map((p) => p.network)));

  return (
    <section className="space-y-4">
      {networks.map((net) => {
        const rows = positions.filter((p) => p.network === net);
        const sym = nativeSymbol(net);
        const totalStake = sumBy(rows, (p) => p.assets);
        const totalEarned = sumBy(rows, (p) => p.totalEarnedAssets);
        const earnedFromStake = sumBy(rows, (p) => p.totalStakeEarnedAssets);
        const earnedFromBoost = sumBy(rows, (p) => p.totalBoostEarnedAssets);
        const apy = weightedApy(rows);
        return (
          <div key={net} className="rounded-2xl border border-border/60 bg-gradient-to-b from-panel to-bg p-5 glow">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-muted">{net} · {rows.length} vault{rows.length===1?"":"s"}</div>
              <div className="text-xs text-dim">weighted APY <span className="text-accent2 font-semibold">{apy.toFixed(2)}%</span></div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label={`Total stake (${sym})`} value={formatAssets(totalStake)} accent />
              <Stat label={`Lifetime earned (${sym})`} value={formatAssets(totalEarned)} accentColor="text-accent2" />
              <Stat label={`from stake (${sym})`} value={formatAssets(earnedFromStake)} small />
              <Stat label={`from boost (${sym})`} value={formatAssets(earnedFromBoost)} small />
            </div>
          </div>
        );
      })}
      {positions.length > 0 && networks.length === 0 && (
        <div className="text-xs text-dim">No positions to summarize.</div>
      )}
    </section>
  );
}

function Stat({ label, value, accent, accentColor, small }: { label: string; value: string; accent?: boolean; accentColor?: string; small?: boolean }) {
  return (
    <div>
      <div className={small ? "text-xs text-dim" : "text-xs text-muted"}>{label}</div>
      <div className={`${small ? "text-base font-medium" : "text-2xl font-bold"} ${accentColor ?? (accent ? "text-text" : "text-text")} tabular-nums`}>
        {value}
      </div>
    </div>
  );
}
