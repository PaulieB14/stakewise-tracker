import { AddressForm } from "@/components/AddressForm";
import { PositionRow } from "@/components/PositionRow";
import { SummaryHero } from "@/components/SummaryHero";
import { fetchAllPositions, isValidAddress } from "@/lib/stakewise";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw);
  if (!isValidAddress(address)) notFound();

  const positions = await fetchAllPositions(address);
  const lower = address.toLowerCase();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs text-dim uppercase tracking-wide">Wallet</div>
          <div className="font-mono text-sm sm:text-base break-all">{lower}</div>
        </div>
        <div className="sm:max-w-sm w-full">
          <AddressForm defaultValue={lower} />
        </div>
      </div>

      <SummaryHero positions={positions} />

      {positions.length === 0 ? (
        <EmptyState address={lower} />
      ) : (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            {positions.length} active position{positions.length === 1 ? "" : "s"}
          </h2>
          <div className="space-y-3">
            {positions.map((p) => (
              <PositionRow key={`${p.network}-${p.vault.id}`} p={p} address={lower} />
            ))}
          </div>
        </section>
      )}

      <details className="text-xs text-dim border-t border-border/40 pt-6">
        <summary className="cursor-pointer hover:text-muted">How this works</summary>
        <div className="mt-2 space-y-1">
          <p>
            One GraphQL query per network against StakeWise's own graph nodes
            (<code className="text-accent2">graphs.stakewise.io</code>) — Mainnet + Gnosis fetched in parallel.
            Results cached 60s. No wallet connect, no signing, no API key, no data stored.
          </p>
          <p>
            <strong>Earned</strong> = lifetime base staking + boost yield in the native asset.
            <strong> APY</strong> is your current personalized APY for that vault including any leverage boost.
            <strong> Share</strong> = your stake ÷ vault total assets.
          </p>
        </div>
      </details>
    </div>
  );
}

function EmptyState({ address }: { address: string }) {
  return (
    <section className="rounded-xl border border-border/60 bg-panel/40 p-6 text-center">
      <div className="text-2xl">🪹</div>
      <div className="mt-2 font-semibold">No active StakeWise positions found</div>
      <p className="mt-1 text-sm text-muted">
        We checked every public vault on Mainnet and Gnosis and didn't find a stake from{" "}
        <span className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</span>.
      </p>
      <p className="mt-2 text-xs text-dim">
        This is "active stake" only — if you've fully withdrawn or only hold osETH/osGNO
        liquid tokens, they won't appear here.
      </p>
      <a
        href="https://app.stakewise.io/vaults"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-md bg-accent text-bg px-4 py-2 text-sm font-semibold hover:brightness-110"
      >
        Browse vaults on StakeWise ↗
      </a>
    </section>
  );
}
