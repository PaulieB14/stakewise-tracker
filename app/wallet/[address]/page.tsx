import { AddressForm } from "@/components/AddressForm";
import { AlertsCard } from "@/components/AlertsCard";
import { CsvDownload } from "@/components/CsvDownload";
import { PositionRow } from "@/components/PositionRow";
import { SummaryHero } from "@/components/SummaryHero";
import { WithdrawalBanner } from "@/components/WithdrawalBanner";
import { reverseEns } from "@/lib/ens";
import { fetchPrices, formatUsd } from "@/lib/prices";
import { fetchAllPositions, isValidAddress } from "@/lib/stakewise";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw).toLowerCase();
  if (!isValidAddress(address)) notFound();

  const [positions, prices, ensName] = await Promise.all([
    fetchAllPositions(address),
    fetchPrices(),
    reverseEns(address).catch(() => null),
  ]);

  const asOfStale =
    prices.asOf && Date.now() - new Date(prices.asOf).getTime() > 10 * 60 * 1000;
  const hasGnosis = positions.some((p) => p.network === "gnosis");

  return (
    <div className="space-y-8">
      {/* Wallet header — ENS as plain semibold (not gradient), address inline */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-dim">Wallet</div>
          {ensName ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">{ensName}</h1>
              <span className="text-xs text-dim font-mono tabular-nums">{address.slice(0, 8)}…{address.slice(-6)}</span>
            </div>
          ) : (
            <h1 className="text-base sm:text-lg font-mono break-all mt-1">{address}</h1>
          )}
        </div>
        <div className="sm:max-w-sm w-full">
          <div className="rounded-xl glass p-2">
            <AddressForm defaultValue={ensName || address} />
          </div>
        </div>
      </div>

      {/* Sticky withdrawal banner — only renders if there's anything claimable or pending */}
      <WithdrawalBanner positions={positions} />

      <SummaryHero positions={positions} prices={prices} />

      {positions.length === 0 ? (
        <EmptyState address={address} />
      ) : (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {positions.length} active position{positions.length === 1 ? "" : "s"}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              {prices.ethUsd > 0 && (
                <span className="rounded-md bg-panel/80 border border-white/[0.06] px-2.5 py-1 font-mono tabular-nums">
                  <span className="text-dim">ETH</span> <span className="text-text font-semibold">{formatUsd(prices.ethUsd)}</span>
                </span>
              )}
              {prices.gnoUsd > 0 && hasGnosis && (
                <span className="rounded-md bg-panel/80 border border-white/[0.06] px-2.5 py-1 font-mono tabular-nums">
                  <span className="text-dim">GNO</span> <span className="text-text font-semibold">{formatUsd(prices.gnoUsd)}</span>
                </span>
              )}
              <span className={`text-[11px] ${asOfStale ? "text-warn" : "text-dim"}`}>
                {asOfStale ? "stale · " : ""}via {prices.source}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {positions.map((p) => (
              <PositionRow key={`${p.network}-${p.vault.id}`} p={p} address={address} prices={prices} />
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <AlertsCard address={address} />
        <CsvDownload address={address} />
      </div>

      <details className="text-xs text-dim border-t border-white/[0.06] pt-6">
        <summary className="cursor-pointer hover:text-muted">How this works</summary>
        <div className="mt-2 space-y-1.5">
          <p>
            One GraphQL query per network against StakeWise's own graph nodes
            (<code className="text-accent2">graphs.stakewise.io</code>). Mainnet + Gnosis fetched in
            parallel, cached 60s. No wallet connect, no signing, no API key, no data stored.
          </p>
          <p>
            <strong>Earning/day</strong> is a projection: your stake × current APY ÷ 365.
            <strong> Last 24h</strong> sums the last day's <code>AllocatorSnapshot.earnedAssets</code> across all
            your positions on that network (realized, not projected).
            <strong> 30d sparklines</strong> are cumulative running sums within the visible window.
            <strong> USD</strong> is spot from Coingecko (with Coinbase fallback) — for tax-accurate
            per-tx pricing, use the CSV export which includes snapshot timestamps.
          </p>
        </div>
      </details>
    </div>
  );
}

function EmptyState({ address }: { address: string }) {
  return (
    <section className="rounded-2xl glass p-8 text-center">
      <div className="text-3xl">🪹</div>
      <div className="mt-3 font-semibold text-lg">No active StakeWise positions found</div>
      <p className="mt-1.5 text-sm text-muted max-w-md mx-auto">
        We checked every public vault on Mainnet and Gnosis and didn't find a stake from{" "}
        <span className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</span>.
      </p>
      <p className="mt-2 text-xs text-dim max-w-md mx-auto">
        This is <em>active stake</em> only. If you've fully withdrawn or only hold liquid
        osETH/osGNO, those won't show here.
      </p>
      <a
        href="https://app.stakewise.io/vaults"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:brightness-110"
      >
        Browse vaults on StakeWise ↗
      </a>
    </section>
  );
}
