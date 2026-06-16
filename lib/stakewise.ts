// StakeWise V3 data layer.
//
// Queries StakeWise's self-hosted graph nodes directly — their V3 subgraphs
// on The Graph Network are zombie listings (0 indexer allocations as of
// 2026-06-15), so the SDK/UI both point here. Free, no API key, replica
// failover baked in.
//
// One query per network returns all of a wallet's positions across every
// vault on that network plus the vault metadata + APYs we need to render,
// PLUS the last 90 days of daily snapshots (for sparklines) and the active
// exit-request queue (for withdrawal status).

import { cache } from "react";

export type Network = "mainnet" | "gnosis";

export const NETWORKS: Network[] = ["mainnet", "gnosis"];

const ENDPOINTS: Record<Network, { primary: string; replica: string; backend: string; native: { symbol: string; explorer: string } }> = {
  mainnet: {
    primary: "https://graphs.stakewise.io/mainnet/subgraphs/name/stakewise/prod",
    replica: "https://graphs-replica.stakewise.io/mainnet/subgraphs/name/stakewise/prod",
    backend: "https://mainnet-api.stakewise.io/graphql",
    native: { symbol: "ETH", explorer: "https://etherscan.io" },
  },
  gnosis: {
    primary: "https://graphs.stakewise.io/gnosis/subgraphs/name/stakewise/prod",
    replica: "https://graphs-replica.stakewise.io/gnosis/subgraphs/name/stakewise/prod",
    backend: "https://gnosis-api.stakewise.io/graphql",
    native: { symbol: "GNO", explorer: "https://gnosisscan.io" },
  },
};

export interface VaultMeta {
  id: string;
  displayName: string;
  imageUrl: string | null;
  description: string | null;
  apy: number;
  baseApy: number;
  maxBoostApy: number;
  totalAssets: bigint;
  feePercent: number;
  isPrivate: boolean;
  isErc20: boolean;
}

export interface Snapshot {
  timestamp: number;   // seconds
  earnedAssets: bigint;
  stakeEarnedAssets: bigint;
  boostEarnedAssets: bigint;
  apy: number;
}

export interface ExitRequest {
  id: string;
  positionTicket: string;
  totalAssets: bigint;
  exitedAssets: bigint;
  exitQueueIndex: bigint;
  timestamp: number;   // seconds (request was submitted)
  withdrawalTimestamp: number;
  isClaimable: boolean;
  isClaimed: boolean;
}

export interface VaultPosition {
  network: Network;
  vault: VaultMeta;
  assets: bigint;
  apy: number;
  mintedOsTokenShares: bigint;
  exitingAssets: bigint;
  totalEarnedAssets: bigint;
  totalStakeEarnedAssets: bigint;
  totalBoostEarnedAssets: bigint;
  shareOfVault: number;
  snapshots: Snapshot[];
  exitRequests: ExitRequest[];
}

interface RawSnapshot {
  timestamp: string;
  earnedAssets: string;
  stakeEarnedAssets: string;
  boostEarnedAssets: string;
  apy: string;
}

interface RawExitRequest {
  id: string;
  positionTicket: string;
  totalAssets: string;
  exitedAssets: string;
  exitQueueIndex: string;
  timestamp: string;
  withdrawalTimestamp: string;
  isClaimable: boolean;
  isClaimed: boolean;
}

interface RawAllocator {
  address: string;
  assets: string;
  exitingAssets: string;
  apy: string;
  mintedOsTokenShares: string;
  totalEarnedAssets: string;
  totalStakeEarnedAssets: string;
  totalBoostEarnedAssets: string;
  vault: {
    id: string;
    displayName: string | null;
    tokenName: string | null;
    tokenSymbol: string | null;
    description: string | null;
    imageUrl: string | null;
    apy: string;
    baseApy: string;
    allocatorMaxBoostApy: string;
    totalAssets: string;
    feePercent: number;
    isPrivate: boolean;
    isErc20: boolean;
  };
}

// Single composed query: allocators + the last 90 daily snapshots per
// allocator + active exit requests. Subgraph supports nested filtered
// children via `where` and `first` on @derivedFrom relations.
const POSITIONS_QUERY = `
  query Positions($address: Bytes!) {
    allocators(
      first: 200
      where: { address: $address, assets_gt: "0" }
      orderBy: assets
      orderDirection: desc
    ) {
      address assets exitingAssets apy mintedOsTokenShares
      totalEarnedAssets totalStakeEarnedAssets totalBoostEarnedAssets
      vault {
        id displayName tokenName tokenSymbol description imageUrl
        apy baseApy allocatorMaxBoostApy totalAssets feePercent isPrivate isErc20
      }
    }
    snapshots: allocatorSnapshots(
      first: 1000
      where: { allocator_: { address: $address } }
      orderBy: timestamp
      orderDirection: desc
    ) {
      timestamp earnedAssets stakeEarnedAssets boostEarnedAssets apy
      allocator { vault { id } }
    }
    exits: exitRequests(
      first: 200
      where: { receiver: $address, isClaimed: false }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id positionTicket totalAssets exitedAssets exitQueueIndex
      timestamp withdrawalTimestamp isClaimable isClaimed
      vault { id }
    }
  }
`;

async function fetchSubgraph<T>(network: Network, query: string, variables: Record<string, unknown>): Promise<T> {
  const ep = ENDPOINTS[network];
  for (const url of [ep.primary, ep.replica]) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, variables }),
        next: { revalidate: 60 },
      });
      if (!r.ok) continue;
      const j = (await r.json()) as { data?: T; errors?: { message: string }[] };
      if (j.errors?.length) {
        if (url === ep.replica) throw new Error(`Subgraph: ${j.errors[0].message}`);
        continue;
      }
      if (j.data) return j.data;
    } catch (err) {
      if (url === ep.replica) throw err;
    }
  }
  throw new Error(`StakeWise ${network}: both endpoints unreachable`);
}

function pctFromString(s: string | null | undefined): number {
  if (s == null) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function bigOr0(s: string | null | undefined): bigint {
  if (!s) return 0n;
  try {
    return BigInt(s);
  } catch {
    return 0n;
  }
}

function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase();
}

async function fetchNetworkPositions(network: Network, address: string): Promise<VaultPosition[]> {
  const data = await fetchSubgraph<{
    allocators: RawAllocator[];
    snapshots: (RawSnapshot & { allocator: { vault: { id: string } } })[];
    exits: (RawExitRequest & { vault: { id: string } })[];
  }>(network, POSITIONS_QUERY, { address: normalizeAddress(address) });

  // Bucket snapshots and exit requests by vault id.
  const snapsByVault = new Map<string, Snapshot[]>();
  for (const s of data.snapshots || []) {
    const vid = s.allocator?.vault?.id?.toLowerCase();
    if (!vid) continue;
    const arr = snapsByVault.get(vid) ?? [];
    arr.push({
      timestamp: Math.floor(parseFloat(s.timestamp)),
      earnedAssets: bigOr0(s.earnedAssets),
      stakeEarnedAssets: bigOr0(s.stakeEarnedAssets),
      boostEarnedAssets: bigOr0(s.boostEarnedAssets),
      apy: pctFromString(s.apy),
    });
    snapsByVault.set(vid, arr);
  }
  // Order each vault's snapshots oldest -> newest so charting math is easier.
  for (const arr of snapsByVault.values()) arr.sort((a, b) => a.timestamp - b.timestamp);

  const exitsByVault = new Map<string, ExitRequest[]>();
  for (const e of data.exits || []) {
    const vid = e.vault?.id?.toLowerCase();
    if (!vid) continue;
    const arr = exitsByVault.get(vid) ?? [];
    arr.push({
      id: e.id,
      positionTicket: e.positionTicket,
      totalAssets: bigOr0(e.totalAssets),
      exitedAssets: bigOr0(e.exitedAssets),
      exitQueueIndex: bigOr0(e.exitQueueIndex),
      timestamp: parseInt(e.timestamp || "0", 10),
      withdrawalTimestamp: parseInt(e.withdrawalTimestamp || "0", 10),
      isClaimable: !!e.isClaimable,
      isClaimed: !!e.isClaimed,
    });
    exitsByVault.set(vid, arr);
  }

  return (data.allocators || []).map((a) => {
    const assets = bigOr0(a.assets);
    const totalAssets = bigOr0(a.vault.totalAssets);
    const shareOfVault = totalAssets > 0n
      ? Number((assets * 10_000_000n) / totalAssets) / 10_000_000
      : 0;
    const vid = a.vault.id.toLowerCase();
    const vault: VaultMeta = {
      id: a.vault.id,
      displayName: a.vault.displayName || a.vault.tokenName || a.vault.tokenSymbol || `${a.vault.id.slice(0, 8)}…`,
      imageUrl: a.vault.imageUrl,
      description: a.vault.description,
      apy: pctFromString(a.vault.apy),
      baseApy: pctFromString(a.vault.baseApy),
      maxBoostApy: pctFromString(a.vault.allocatorMaxBoostApy),
      totalAssets,
      feePercent: a.vault.feePercent ?? 0,
      isPrivate: !!a.vault.isPrivate,
      isErc20: !!a.vault.isErc20,
    };
    return {
      network,
      vault,
      assets,
      apy: pctFromString(a.apy),
      mintedOsTokenShares: bigOr0(a.mintedOsTokenShares),
      exitingAssets: bigOr0(a.exitingAssets),
      totalEarnedAssets: bigOr0(a.totalEarnedAssets),
      totalStakeEarnedAssets: bigOr0(a.totalStakeEarnedAssets),
      totalBoostEarnedAssets: bigOr0(a.totalBoostEarnedAssets),
      shareOfVault,
      snapshots: snapsByVault.get(vid) ?? [],
      exitRequests: exitsByVault.get(vid) ?? [],
    };
  });
}

export const fetchAllPositions = cache(async (address: string): Promise<VaultPosition[]> => {
  if (!address) return [];
  const results = await Promise.allSettled(NETWORKS.map((n) => fetchNetworkPositions(n, address)));
  const out: VaultPosition[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") out.push(...r.value);
  }
  out.sort((a, b) => (b.assets > a.assets ? 1 : b.assets < a.assets ? -1 : 0));
  return out;
});

export function nativeSymbol(network: Network): string {
  return ENDPOINTS[network].native.symbol;
}

export function explorerAddress(network: Network, address: string): string {
  return `${ENDPOINTS[network].native.explorer}/address/${address}`;
}

export function isValidAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim());
}

export function formatAssets(wei: bigint, decimals = 18, maxFractionDigits = 4): string {
  if (wei === 0n) return "0";
  const sign = wei < 0n ? "-" : "";
  const abs = wei < 0n ? -wei : wei;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  if (frac === 0n) return `${sign}${whole.toString()}`;
  let fracStr = frac.toString().padStart(decimals, "0");
  fracStr = fracStr.slice(0, maxFractionDigits).replace(/0+$/, "");
  if (!fracStr) return `${sign}${whole.toString()}`;
  return `${sign}${whole.toString()}.${fracStr}`;
}

export function weiToNumber(wei: bigint, decimals = 18): number {
  const s = formatAssets(wei, decimals, 6);
  return parseFloat(s);
}

// ── Calendar-year earnings (CSV export) ──────────────────────────────────────
//
// Compute the user's earned-assets *delta* over the calendar year by diffing
// the latest snapshot in the year vs the latest snapshot before the year
// started. This is the tax-relevant "received this year" number — not the
// vault's APY-times-balance projection.

export interface YearlyEarnings {
  earned: bigint;
  fromStake: bigint;
  fromBoost: bigint;
  startBalance: bigint;
  endBalance: bigint;
}

export function earningsInYear(snapshots: Snapshot[], year: number, currentTotalEarned: bigint, currentStake: bigint, currentBoost: bigint): YearlyEarnings {
  const yearStart = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const yearEnd = Math.floor(Date.UTC(year + 1, 0, 1) / 1000);
  // Snapshots are oldest -> newest.
  const before = [...snapshots].reverse().find((s) => s.timestamp < yearStart);
  const lastInYear = [...snapshots].reverse().find((s) => s.timestamp < yearEnd);
  const startTotal = before?.earnedAssets ?? 0n;
  const startStake = before?.stakeEarnedAssets ?? 0n;
  const startBoost = before?.boostEarnedAssets ?? 0n;
  const endTotal = lastInYear?.earnedAssets ?? currentTotalEarned;
  const endStake = lastInYear?.stakeEarnedAssets ?? currentStake;
  const endBoost = lastInYear?.boostEarnedAssets ?? currentBoost;
  return {
    earned: endTotal - startTotal,
    fromStake: endStake - startStake,
    fromBoost: endBoost - startBoost,
    startBalance: startTotal,
    endBalance: endTotal,
  };
}
