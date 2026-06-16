// Native-asset USD prices. Coingecko free /simple/price — no API key, generous
// rate limit. Cached 5 min via React's server cache so a single render only
// fires one network call regardless of how many position rows reference it.

import { cache } from "react";
import { Network } from "./stakewise";

const COINGECKO_IDS: Record<Network, string> = {
  mainnet: "ethereum",
  gnosis: "xdai", // Gnosis Chain's native gas asset is xDai
};

export interface Prices {
  ethUsd: number;   // ETH (mainnet native)
  gnoUsd: number;   // xDai for gas; for display we use ETH-bridged value on Gnosis
  asOf: string;     // ISO timestamp
}

const FALLBACK: Prices = { ethUsd: 0, gnoUsd: 0, asOf: new Date(0).toISOString() };

export const fetchPrices = cache(async (): Promise<Prices> => {
  try {
    // Gnosis Chain staking is actually GNO-based via the V3 protocol, but the
    // staked-asset accounting in the subgraph is denominated in `assets` units
    // matching the vault's native token. Use ETH for Mainnet, GNO for Gnosis.
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,gnosis&vs_currencies=usd",
      { next: { revalidate: 300 } },
    );
    if (!r.ok) return FALLBACK;
    const j = (await r.json()) as {
      ethereum?: { usd?: number };
      gnosis?: { usd?: number };
    };
    return {
      ethUsd: j.ethereum?.usd ?? 0,
      gnoUsd: j.gnosis?.usd ?? 0,
      asOf: new Date().toISOString(),
    };
  } catch {
    return FALLBACK;
  }
});

export function priceForNetwork(prices: Prices, network: Network): number {
  return network === "mainnet" ? prices.ethUsd : prices.gnoUsd;
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 100) return `$${n.toFixed(0)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}
