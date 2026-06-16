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
// Exclude dust-only positions (< 0.0001 native asset). Withdrawn positions
// often leave behind tiny wei balances that pass the assets_gt: "0" filter
// but render as "stake: 0" in the UI and confuse users about what's actually
// active. 0.0001 ETH ≈ $0.20 today — cleanly above wei-level dust.
const DUST_THRESHOLD_WEI = "100000000000000"; // 1e14 wei = 0.0001 native asset

const POSITIONS_QUERY = `
  query Positions($address: Bytes!) {
    allocators(
      first: 200
      where: { address: $address, assets_gt: "${DUST_THRESHOLD_WEI}" }
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
  //
  // Subgraph quirk: AllocatorSnapshot.timestamp uses the GraphQL `Timestamp`
  // scalar which encodes microseconds (16-digit values like
  // 1781481600000000), NOT seconds. Convert to seconds for sane date math.
  // ExitRequest.timestamp + .withdrawalTimestamp use the standard BigInt
  // scalar which is already seconds — DON'T divide those.
  //
  // Also: snapshot.earnedAssets is the rewards earned DURING that snapshot's
  // period (1 day), not a cumulative total. Year-window math must sum these
  // per-period values inside the window, not diff endpoints.
  const snapsByVault = new Map<string, Snapshot[]>();
  for (const s of data.snapshots || []) {
    const vid = s.allocator?.vault?.id?.toLowerCase();
    if (!vid) continue;
    const arr = snapsByVault.get(vid) ?? [];
    arr.push({
      timestamp: Math.floor(parseFloat(s.timestamp) / 1_000_000),
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
// AllocatorSnapshot.earnedAssets is per-period (one day's rewards), NOT a
// cumulative total. Year-window earnings = sum of per-day earnings where
// snapshot.timestamp falls inside the calendar year. Same for the
// stake/boost split. snapshotCount tells the caller how many days actually
// had snapshots in the window (sanity check — if 0, there's no data for
// that year and the row should be flagged as such in the CSV).

export interface YearlyEarnings {
  earned: bigint;
  fromStake: bigint;
  fromBoost: bigint;
  snapshotCount: number;
  firstSnapshot: number | null;  // seconds
  lastSnapshot: number | null;
}

export function earningsInYear(snapshots: Snapshot[], year: number): YearlyEarnings {
  const yearStart = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const yearEnd = Math.floor(Date.UTC(year + 1, 0, 1) / 1000);
  let earned = 0n;
  let fromStake = 0n;
  let fromBoost = 0n;
  let snapshotCount = 0;
  let firstSnapshot: number | null = null;
  let lastSnapshot: number | null = null;
  for (const s of snapshots) {
    if (s.timestamp < yearStart || s.timestamp >= yearEnd) continue;
    earned += s.earnedAssets;
    fromStake += s.stakeEarnedAssets;
    fromBoost += s.boostEarnedAssets;
    snapshotCount++;
    if (firstSnapshot === null || s.timestamp < firstSnapshot) firstSnapshot = s.timestamp;
    if (lastSnapshot === null || s.timestamp > lastSnapshot) lastSnapshot = s.timestamp;
  }
  return { earned, fromStake, fromBoost, snapshotCount, firstSnapshot, lastSnapshot };
}
