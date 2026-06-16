import { ExitRequest, Network, formatNative, nativeSymbol } from "@/lib/stakewise";

function fmtTimeAgo(seconds: number): string {
  if (!seconds) return "—";
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtEta(withdrawalTimestamp: number): string {
  if (!withdrawalTimestamp) return "calculating…";
  const diff = withdrawalTimestamp - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "ready now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function WithdrawalStatus({ requests, network, vaultId }: { requests: ExitRequest[]; network: Network; vaultId: string }) {
  const sym = nativeSymbol(network);
  // Hide if no active requests.
  const active = requests.filter((r) => !r.isClaimed);
  if (active.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-warn/30 bg-warn/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-warn">
          {active.length} active withdrawal{active.length === 1 ? "" : "s"} from this vault
        </div>
        <a
          href={`https://app.stakewise.io/vault/${network}/${vaultId}/withdrawals`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline text-warn/80 hover:text-warn"
        >
          Manage on StakeWise ↗
        </a>
      </div>
      <ul className="mt-2 space-y-1.5 text-xs">
        {active.slice(0, 4).map((r) => {
          const total = formatNative(r.totalAssets, { mode: "compact" });
          const exited = formatNative(r.exitedAssets, { mode: "compact" });
          const progressBp = r.totalAssets > 0n
            ? Number((r.exitedAssets * 10_000n) / r.totalAssets) / 100
            : 0;
          return (
            <li key={r.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono tabular-nums">{exited} / {total} {sym}</span>
                <span className="text-dim">·</span>
                <span className="text-muted">requested {fmtTimeAgo(r.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 rounded-full bg-panelHi overflow-hidden">
                  <div className="h-full bg-warn" style={{ width: `${progressBp}%` }} />
                </div>
                <span className={`text-xs font-semibold ${r.isClaimable ? "text-accent2" : "text-warn"}`}>
                  {r.isClaimable ? "claimable" : fmtEta(r.withdrawalTimestamp)}
                </span>
              </div>
            </li>
          );
        })}
        {active.length > 4 && (
          <li className="text-dim">+ {active.length - 4} more</li>
        )}
      </ul>
    </div>
  );
}
