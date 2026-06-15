// StakeWise V3 data layer.
//
// Queries StakeWise's self-hosted graph nodes directly — their V3 subgraphs
// on The Graph Network are zombie listings (0 indexer allocations as of
// 2026-06-15), so the SDK/UI both point here. Free, no API key, replica
// failover baked in.
//
// One query per network returns all of a wallet's positions across every
// vault on that network plus the vault metadata + APYs we need to render.

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
  id: string;             // vault contract address
  displayName: string;
  imageUrl: string | null;
  description: string | null;
  apy: number;            // %
  baseApy: number;        // %
  maxBoostApy: number;    // %
  totalAssets: bigint;
  feePercent: number;     // basis points / 100; raw int from contract
  isPrivate: boolean;
  isErc20: boolean;
}

export interface VaultPosition {
  network: Network;
  vault: VaultMeta;
  assets: bigint;                // user's stake in native-asset wei
  apy: number;                   // user-level APY %
  mintedOsTokenShares: bigint;   // osETH/osGNO minted against this stake
  exitingAssets: bigint;
  totalEarnedAssets: bigint;     // lifetime
  totalStakeEarnedAssets: bigint;
  totalBoostEarnedAssets: bigint;
  shareOfVault: number;          // user.assets / vault.totalAssets
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

const ALLOCATORS_QUERY = `
  query AllocatorsForAddress($address: Bytes!) {
    allocators(
      first: 200
      where: { address: $address, assets_gt: "0" }
      orderBy: assets
      orderDirection: desc
    ) {
      address
      assets
      exitingAssets
      apy
      mintedOsTokenShares
      totalEarnedAssets
      totalStakeEarnedAssets
      totalBoostEarnedAssets
      vault {
        id
        displayName
        tokenName
        tokenSymbol
        description
        imageUrl
        apy
        baseApy
        allocatorMaxBoostApy
        totalAssets
        feePercent
        isPrivate
        isErc20
      }
    }
  }
`;

async function fetchSubgraph<T>(network: Network, query: string, variables: Record<string, unknown>): Promise<T> {
  const ep = ENDPOINTS[network];
  // Try primary first, fall back to replica on any error/non-200. StakeWise
  // explicitly designs `graphs-replica.*` as a hot standby.
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
  const data = await fetchSubgraph<{ allocators: RawAllocator[] }>(network, ALLOCATORS_QUERY, {
    address: normalizeAddress(address),
  });
  return (data.allocators || []).map((a) => {
    const assets = bigOr0(a.assets);
    const totalAssets = bigOr0(a.vault.totalAssets);
    const shareOfVault = totalAssets > 0n
      ? Number((assets * 10_000_000n) / totalAssets) / 10_000_000
      : 0;
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
  // Largest stake first.
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

// Pretty-format wei -> "12.3456" with up to 4 decimals, no trailing zeros.
export function formatAssets(wei: bigint, decimals = 18, maxFractionDigits = 4): string {
  if (wei === 0n) return "0";
  const sign = wei < 0n ? "-" : "";
  const abs = wei < 0n ? -wei : wei;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  if (frac === 0n) return `${sign}${whole.toString()}`;
  // Build fractional with full precision then trim
  let fracStr = frac.toString().padStart(decimals, "0");
  fracStr = fracStr.slice(0, maxFractionDigits).replace(/0+$/, "");
  if (!fracStr) return `${sign}${whole.toString()}`;
  return `${sign}${whole.toString()}.${fracStr}`;
}

// Same but returns a number (lossy for very large balances; fine for display sums).
export function weiToNumber(wei: bigint, decimals = 18): number {
  const s = formatAssets(wei, decimals, 6);
  return parseFloat(s);
}
