import { ExitRequest, Network, VaultPosition, formatNative, nativeSymbol } from "@/lib/stakewise";

interface BannerExit extends ExitRequest {
  network: Network;
  vaultId: string;
  vaultName: string;
}

function flatten(positions: VaultPosition[]): BannerExit[] {
  const out: BannerExit[] = [];
  for (const p of positions) {
    for (const r of p.exitRequests) {
      if (r.isClaimed) continue;
      out.push({ ...r, network: p.network, vaultId: p.vault.id, vaultName: p.vault.displayName });
    }
  }
  return out;
}

function fmtEta(withdrawalTimestamp: number): string {
  if (!withdrawalTimestamp) return "calculating";
  const diff = withdrawalTimestamp - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "ready";
  if (diff < 3600) return `~${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `~${Math.floor(diff / 3600)}h`;
  return `~${Math.floor(diff / 86400)}d`;
}

export function WithdrawalBanner({ positions }: { positions: VaultPosition[] }) {
  const exits = flatten(positions);
  if (exits.length === 0) return null;
  const claimable = exits.filter((e) => e.isClaimable);
  const pending = exits.filter((e) => !e.isClaimable);
  // Aggregate native amount across either group, per network.
  const sumByNet = (rows: BannerExit[]) => {
    const out = new Map<Network, bigint>();
    for (const r of rows) {
      const cur = out.get(r.network) ?? 0n;
      out.set(r.network, cur + (r.totalAssets - r.exitedAssets));
    }
    return out;
  };
  const claimSum = sumByNet(claimable);
  const pendSum = sumByNet(pending);

  // Soonest pending ETA for the chip subtitle.
  const soonest = pending.reduce<number | null>(
    (acc, r) => (acc === null || r.withdrawalTimestamp < acc ? r.withdrawalTimestamp : acc),
    null,
  );

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0c1426] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-accent2/10 border border-accent2/30 grid place-items-center text-accent2 text-base">
          ⛏
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">
            {claimable.length > 0 && (
              <span className="text-accent2">
                {claimable.length} withdrawal{claimable.length === 1 ? "" : "s"} claimable now
              </span>
            )}
            {claimable.length > 0 && pending.length > 0 && <span className="text-dim"> · </span>}
            {pending.length > 0 && (
              <span className="text-warn">
                {pending.length} pending{soonest ? ` (next ${fmtEta(soonest)})` : ""}
              </span>
            )}
          </div>
          <div className="text-xs text-muted mt-0.5 tabular-nums font-mono">
            {Array.from(claimSum.entries()).map(([net, wei]) => (
              <span key={`c-${net}`} className="mr-3">
                <span className="text-accent2">Claimable: </span>
                {formatNative(wei, { mode: "compact" })} {nativeSymbol(net)}
                <span className="text-dim"> ({net})</span>
              </span>
            ))}
            {Array.from(pendSum.entries()).map(([net, wei]) => (
              <span key={`p-${net}`} className="mr-3">
                <span className="text-warn">Pending: </span>
                {formatNative(wei, { mode: "compact" })} {nativeSymbol(net)}
                <span className="text-dim"> ({net})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from(new Set(exits.map((e) => `${e.network}|${e.vaultId}|${e.vaultName}`))).map((key) => {
          const [network, vaultId, vaultName] = key.split("|");
          return (
            <a
              key={key}
              href={`#vault-${vaultId.toLowerCase()}`}
              className="rounded-md border border-white/[0.08] bg-panelHi px-2.5 py-1 text-xs hover:bg-panel transition"
            >
              {vaultName} <span className="text-dim">↓</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
