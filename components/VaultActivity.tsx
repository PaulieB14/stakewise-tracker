"use client";

import { useEffect, useState } from "react";
import {
  ActivityEvent,
  Network,
  VaultActivity as VaultActivityData,
  fetchVaultActivity,
  formatNative,
  nativeSymbol,
} from "@/lib/stakewise";

// Collapsible "Stakers / Transactions" panel under each PositionRow.
// Lazy-fetches on first expand so the wallet page LCP isn't dragged down by
// 30 of these firing on a multi-vault staker. One subgraph round trip per
// (vault, user) returns leaderboard + activity together.
export function VaultActivity({
  network,
  vaultId,
  vaultTotalAssets,
  userAddress,
}: {
  network: Network;
  vaultId: string;
  vaultTotalAssets: bigint;
  userAddress: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"stakers" | "tx">("stakers");
  const [data, setData] = useState<VaultActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data || loading) return;
    setLoading(true);
    fetchVaultActivity(network, vaultId, userAddress)
      .then(setData)
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, data, loading, network, vaultId, userAddress]);

  const sym = nativeSymbol(network);

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-xs text-muted hover:text-text transition"
      >
        <span className="flex items-center gap-2">
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
          Stakers &amp; transactions
        </span>
        {data && (
          <span className="text-dim tabular-nums">
            {data.totalAllocatorCount}{data.totalAllocatorCount >= 1000 ? "+" : ""} stakers · {data.events.length} recent tx
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-[#0b1020]/60">
          {/* Tab strip */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-b border-white/[0.04]">
            <TabBtn active={tab === "stakers"} onClick={() => setTab("stakers")}>
              Stakers{data && <span className="ml-1.5 text-dim tabular-nums">{data.totalAllocatorCount}{data.totalAllocatorCount >= 1000 ? "+" : ""}</span>}
            </TabBtn>
            <TabBtn active={tab === "tx"} onClick={() => setTab("tx")}>
              Transactions{data && <span className="ml-1.5 text-dim tabular-nums">{data.events.length}</span>}
            </TabBtn>
          </div>

          <div className="p-3">
            {loading && <Skeleton />}
            {err && <div className="text-xs text-danger">Failed to load: {err}</div>}
            {data && !loading && tab === "stakers" && (
              <Leaderboard data={data} vaultTotalAssets={vaultTotalAssets} userAddress={userAddress} network={network} sym={sym} />
            )}
            {data && !loading && tab === "tx" && <TxList events={data.events} network={network} sym={sym} />}
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${active ? "bg-white/[0.08] text-text" : "text-muted hover:text-text"}`}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-6 rounded bg-white/[0.03] animate-pulse" />
      ))}
    </div>
  );
}

function Leaderboard({
  data,
  vaultTotalAssets,
  userAddress,
  network,
  sym,
}: {
  data: VaultActivityData;
  vaultTotalAssets: bigint;
  userAddress: string;
  network: Network;
  sym: string;
}) {
  // Privacy: hide full list on private vaults, show just the user's share.
  if (data.isPrivate) {
    const sharePct = vaultTotalAssets > 0n ? Number((data.userAssets * 10_000n) / vaultTotalAssets) / 100 : 0;
    return (
      <div className="text-xs text-muted">
        <span className="text-accent2">●</span> Private vault — leaderboard hidden.{" "}
        {data.userAssets > 0n && (
          <>You stake <span className="text-text tabular-nums">{formatNative(data.userAssets, { mode: "compact" })} {sym}</span> ({sharePct.toFixed(2)}% share)</>
        )}
      </div>
    );
  }

  // Small cohort: skip the table chrome.
  if (data.leaderboard.length < 3) {
    return (
      <div className="text-xs text-muted">
        Only {data.leaderboard.length} active staker{data.leaderboard.length === 1 ? "" : "s"} in this vault.
      </div>
    );
  }

  const userLower = userAddress.toLowerCase();
  const userInTop = data.userRank !== null;
  const sharePct = vaultTotalAssets > 0n ? Number((data.userAssets * 10_000n) / vaultTotalAssets) / 100 : 0;

  return (
    <div>
      {data.userAssets > 0n && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="size-1.5 rounded-full bg-accent2 animate-pulse" />
          <span className="text-muted">
            You rank{" "}
            <span className="text-text font-semibold tabular-nums">
              #{data.userRank ?? `${data.leaderboard.length}+`}
            </span>{" "}
            <span className="text-dim">
              of {data.totalAllocatorCount}{data.totalAllocatorCount >= 1000 ? "+" : ""}
            </span>
            <span className="text-dim mx-1.5">·</span>
            <span className="text-text tabular-nums">{sharePct.toFixed(2)}%</span> <span className="text-dim">share</span>
          </span>
        </div>
      )}

      <ul className="divide-y divide-white/[0.04] text-xs">
        {data.leaderboard.slice(0, 10).map((r, i) => (
          <StakerLi key={r.address} row={r} rank={i + 1} isYou={r.address === userLower} vaultTotalAssets={vaultTotalAssets} sym={sym} />
        ))}
        {/* Inject the user row at the bottom if they're outside the top 10 */}
        {userInTop && (data.userRank ?? 0) > 10 && (
          <>
            <li className="py-1 text-center text-dim">⋮</li>
            <StakerLi
              row={{ address: userLower, assets: data.userAssets }}
              rank={data.userRank!}
              isYou
              vaultTotalAssets={vaultTotalAssets}
              sym={sym}
            />
          </>
        )}
      </ul>

      {data.leaderboard.length > 10 && (
        <div className="mt-2 text-[11px] text-dim text-center">
          Showing top 10 of {data.totalAllocatorCount}{data.totalAllocatorCount >= 1000 ? "+" : ""}
        </div>
      )}
    </div>
  );
}

function StakerLi({
  row,
  rank,
  isYou,
  vaultTotalAssets,
  sym,
}: {
  row: StakerRow;
  rank: number;
  isYou: boolean;
  vaultTotalAssets: bigint;
  sym: string;
}) {
  const sharePct = vaultTotalAssets > 0n ? Number((row.assets * 10_000n) / vaultTotalAssets) / 100 : 0;
  const short = `${row.address.slice(0, 6)}…${row.address.slice(-4)}`;
  return (
    <li
      className={`grid grid-cols-[32px_1fr_auto_auto] items-center gap-3 py-1.5 ${
        isYou ? "border-l-2 border-accent2 bg-accent2/[0.04] pl-2" : ""
      }`}
    >
      <span className="text-dim tabular-nums">#{rank}</span>
      <span className="font-mono text-muted truncate">
        {short}
        {isYou && <span className="ml-2 text-[10px] uppercase tracking-wider text-accent2">you</span>}
      </span>
      <span className="text-text font-mono tabular-nums">
        {formatNative(row.assets, { mode: "compact" })} {sym}
      </span>
      <span className="text-dim tabular-nums w-12 text-right">{sharePct.toFixed(2)}%</span>
    </li>
  );
}

// Local type to keep the row prop tidy.
interface StakerRow {
  address: string;
  assets: bigint;
}

function TxList({ events, network, sym }: { events: ActivityEvent[]; network: Network; sym: string }) {
  if (events.length === 0) {
    return <div className="text-xs text-muted">No on-chain activity in this vault yet.</div>;
  }
  const explorer = network === "mainnet" ? "https://etherscan.io" : "https://gnosisscan.io";
  return (
    <ul className="divide-y divide-white/[0.04] text-xs">
      {events.map((e) => (
        <li key={`${e.hash}-${e.actionType}`} className="grid grid-cols-[18px_1fr_auto_auto] items-center gap-3 py-1.5">
          <ActionIcon type={e.actionType} />
          <span className="text-muted">{labelFor(e.actionType)}</span>
          <span className="text-text font-mono tabular-nums">
            {formatNative(e.assets, { mode: "compact" })} {sym}
          </span>
          <a
            href={`${explorer}/tx/${e.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim hover:text-text font-mono tabular-nums"
            title={e.hash}
          >
            {timeAgo(e.timestamp)} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

function labelFor(type: string): string {
  switch (type) {
    case "Deposited": return "Deposited";
    case "Redeemed": return "Redeemed";
    case "Withdrew": return "Withdrew";
    case "ExitQueueEntered": return "Requested exit";
    case "ExitedAssetsClaimed": return "Claimed exit";
    case "OsTokenMinted": return "Minted osToken";
    case "OsTokenBurned": return "Burned osToken";
    case "OsTokenLiquidated": return "osToken liquidated";
    case "OsTokenRedeemed": return "osToken redeemed";
    case "BoostDeposited": return "Boost deposited";
    case "BoostExitQueueEntered": return "Boost exit requested";
    case "BoostExitedAssetsClaimed": return "Boost exit claimed";
    default: return type;
  }
}

function ActionIcon({ type }: { type: string }) {
  const color =
    type === "Deposited" || type === "BoostDeposited" || type === "OsTokenMinted" ? "text-accent2"
    : type === "Withdrew" || type === "ExitQueueEntered" || type === "ExitedAssetsClaimed" || type === "OsTokenBurned" || type === "BoostExitQueueEntered" || type === "BoostExitedAssetsClaimed" ? "text-warn"
    : type === "OsTokenLiquidated" ? "text-danger"
    : "text-accent";
  const glyph =
    type === "Deposited" || type === "BoostDeposited" ? "↓"
    : type === "Withdrew" || type === "ExitQueueEntered" || type === "BoostExitQueueEntered" ? "↑"
    : type === "ExitedAssetsClaimed" || type === "BoostExitedAssetsClaimed" ? "✓"
    : type === "OsTokenMinted" ? "+"
    : type === "OsTokenBurned" || type === "OsTokenRedeemed" ? "−"
    : type === "OsTokenLiquidated" ? "!"
    : "•";
  return <span className={`text-center ${color}`}>{glyph}</span>;
}

function timeAgo(seconds: number): string {
  if (!seconds) return "—";
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / (30 * 86400))}mo`;
}
