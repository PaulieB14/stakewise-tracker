import { Prices, formatUsd, priceForNetwork } from "@/lib/prices";
import { VaultPosition, formatAssets, formatNative, nativeSymbol, weiToNumber } from "@/lib/stakewise";

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

// Sum across all positions' last-24h snapshots. Snapshots are oldest -> newest.
function sumLast24hWei(rows: VaultPosition[]): bigint {
  const cutoff = Math.floor(Date.now() / 1000) - 86400;
  let total = 0n;
  for (const r of rows) {
    for (const s of r.snapshots) {
      if (s.timestamp >= cutoff) total += s.earnedAssets;
    }
  }
  return total;
}

// APY-based projection: stake * apy/100 / 365 in native asset units.
// Operates in wei to preserve precision; result is wei per day.
function projectedDailyWei(rows: VaultPosition[]): bigint {
  let dailyWei = 0n;
  for (const r of rows) {
    // (stake * apyBp) / 365 / 10000 where apyBp = apy * 100 (basis points).
    const apyBp = BigInt(Math.round(r.apy * 100));
    dailyWei += (r.assets * apyBp) / 365n / 10_000n;
  }
  return dailyWei;
}

export function SummaryHero({ positions, prices }: { positions: VaultPosition[]; prices: Prices }) {
  const networks = Array.from(new Set(positions.map((p) => p.network)));

  return (
    <section className="space-y-4">
      {networks.map((net) => {
        const rows = positions.filter((p) => p.network === net);
        const sym = nativeSymbol(net);
        const price = priceForNetwork(prices, net);
        const totalStake = sumBy(rows, (p) => p.assets);
        const totalEarned = sumBy(rows, (p) => p.totalEarnedAssets);
        const earnedFromStake = sumBy(rows, (p) => p.totalStakeEarnedAssets);
        const earnedFromBoost = sumBy(rows, (p) => p.totalBoostEarnedAssets);
        const apy = weightedApy(rows);
        const last24 = sumLast24hWei(rows);
        const projDaily = projectedDailyWei(rows);
        const totalStakeUsd = price > 0 ? weiToNumber(totalStake) * price : 0;
        const totalEarnedUsd = price > 0 ? weiToNumber(totalEarned) * price : 0;
        const last24Usd = price > 0 ? weiToNumber(last24) * price : 0;
        const projDailyUsd = price > 0 ? weiToNumber(projDaily) * price : 0;
        return (
          <div key={net} className="rounded-2xl glass p-6 glow">
            {/* Header: network + APY (white, not teal — saving teal for realized) */}
            <div className="flex flex-wrap items-center gap-y-1 mb-5">
              <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-dim">
                {net} · {rows.length} vault{rows.length === 1 ? "" : "s"}
              </div>
              <div className="ml-auto text-xs text-dim">
                weighted APY <span className="text-text font-semibold tabular-nums">{apy.toFixed(2)}%</span>
              </div>
            </div>

            {/* 4-col grid: 2 hero KPIs + 2 supporting.
                gap-x narrowed at small breakpoint and only relaxed at sm+ —
                avoids tablet-portrait collision. */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-5">
              <Hero
                label={`Total stake (${sym})`}
                value={formatNative(totalStake, { mode: "hero" })}
                usd={totalStakeUsd}
              />
              <Hero
                label={`Lifetime earned (${sym})`}
                value={formatNative(totalEarned, { mode: "hero" })}
                usd={totalEarnedUsd}
                accent
                subtitle={
                  earnedFromBoost > 0n
                    ? `stake ${formatNative(earnedFromStake, { mode: "compact" })} · boost ${formatNative(earnedFromBoost, { mode: "compact" })}`
                    : earnedFromStake > 0n
                      ? `base only · no boost active`
                      : undefined
                }
              />
              <Support
                label={`Earning/day (${sym})`}
                value={formatNative(projDaily, { mode: "rate", zeroPlaceholder: "—" })}
                usd={projDailyUsd}
                hint="projected · APY × stake / 365"
              />
              <Support
                label={`Last 24h (${sym})`}
                value={formatNative(last24, { mode: "rate", zeroPlaceholder: "—" })}
                usd={last24Usd}
                hint={last24 > 0n ? "realized" : "snapshot pending"}
                positive={last24 > 0n}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}

function Hero({ label, value, usd, accent, subtitle }: { label: string; value: string; usd: number; accent?: boolean; subtitle?: string }) {
  return (
    <div className="sm:col-span-1 sm:border-l-0 min-w-0">
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-dim">{label}</div>
      {/* text-5xl only kicks in at lg (1024px+) — at sm/md (tablet portrait,
          small laptops) the 4-col grid cells are 176-240px wide which can't
          hold a "27,324.82" at 48px. Delay the jump so whales render cleanly
          on tablets. */}
      <div className={`text-4xl sm:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums leading-none mt-1.5 overflow-hidden ${accent ? "text-accent2" : "text-text"}`}>
        {value}
      </div>
      {usd > 0 && (
        <div className="text-base text-muted font-medium tabular-nums mt-1.5">{formatUsd(usd)}</div>
      )}
      {subtitle && (
        <div className="text-[11px] text-dim font-mono tabular-nums mt-1 leading-tight">{subtitle}</div>
      )}
    </div>
  );
}

function Support({ label, value, usd, hint, positive }: { label: string; value: string; usd: number; hint?: string; positive?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-dim">{label}</div>
      <div className={`text-xl font-semibold tracking-tight tabular-nums leading-none mt-1.5 overflow-hidden ${positive ? "text-accent2" : "text-text"}`}>
        {value}
      </div>
      {usd > 0 && (
        <div className="text-sm text-muted tabular-nums mt-1">{formatUsd(usd)}</div>
      )}
      {hint && (
        <div className="text-[11px] text-dim mt-1">{hint}</div>
      )}
    </div>
  );
}
