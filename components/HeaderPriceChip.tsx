import { fetchPrices, formatUsd } from "@/lib/prices";

// Live ETH/GNO spot rate, rendered into the sticky site header.
// Server-rendered with the same 5min Coingecko cache as the wallet page,
// so this stays cheap regardless of pageviews.
export async function HeaderPriceChip() {
  const prices = await fetchPrices();
  if (!prices.ethUsd && !prices.gnoUsd) return null;
  const stale = prices.asOf && Date.now() - new Date(prices.asOf).getTime() > 10 * 60 * 1000;
  return (
    <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
      {prices.ethUsd > 0 && (
        <span className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-1 tabular-nums">
          <span className="text-dim">ETH</span>{" "}
          <span className="text-text font-semibold">{formatUsd(prices.ethUsd)}</span>
        </span>
      )}
      {prices.gnoUsd > 0 && (
        <span className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-1 tabular-nums">
          <span className="text-dim">GNO</span>{" "}
          <span className="text-text font-semibold">{formatUsd(prices.gnoUsd)}</span>
        </span>
      )}
      <span className={`size-1.5 rounded-full ${stale ? "bg-warn animate-pulse" : "bg-accent2 animate-pulse"}`} aria-label="live" />
    </div>
  );
}
