// Native-asset USD prices. Multi-source with fallback so a single rate-limit
// on Coingecko doesn't blank out the entire dashboard's USD display.

import { cache } from "react";
import { Network } from "./stakewise";

export interface Prices {
  ethUsd: number;
  gnoUsd: number;
  asOf: string;
  source: string; // which provider answered ("coingecko" | "coinbase" | "env" | "none")
}

const FALLBACK: Prices = { ethUsd: 0, gnoUsd: 0, asOf: new Date(0).toISOString(), source: "none" };

async function fromCoingecko(): Promise<Prices | null> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,gnosis&vs_currencies=usd",
      { next: { revalidate: 300 } },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { ethereum?: { usd?: number }; gnosis?: { usd?: number } };
    const ethUsd = j.ethereum?.usd ?? 0;
    const gnoUsd = j.gnosis?.usd ?? 0;
    if (!ethUsd && !gnoUsd) return null;
    return { ethUsd, gnoUsd, asOf: new Date().toISOString(), source: "coingecko" };
  } catch {
    return null;
  }
}

async function fromCoinbase(): Promise<Prices | null> {
  // Coinbase's free spot API returns string prices for any supported pair.
  // No rate limit headaches; works as a robust fallback for the ETH side.
  // (Gnosis isn't on Coinbase, so gnoUsd stays 0 unless Coingecko answered.)
  try {
    const [eth, gno] = await Promise.allSettled([
      fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", { next: { revalidate: 300 } }).then((r) => r.json()),
      fetch("https://api.coinbase.com/v2/prices/GNO-USD/spot", { next: { revalidate: 300 } }).then((r) => r.json()).catch(() => null),
    ]);
    let ethUsd = 0;
    let gnoUsd = 0;
    if (eth.status === "fulfilled") {
      const v = parseFloat(eth.value?.data?.amount ?? "0");
      if (Number.isFinite(v)) ethUsd = v;
    }
    if (gno.status === "fulfilled" && gno.value) {
      const v = parseFloat(gno.value?.data?.amount ?? "0");
      if (Number.isFinite(v)) gnoUsd = v;
    }
    if (!ethUsd && !gnoUsd) return null;
    return { ethUsd, gnoUsd, asOf: new Date().toISOString(), source: "coinbase" };
  } catch {
    return null;
  }
}

function fromEnv(): Prices | null {
  // Last-resort manual price override. Useful for testing or when both
  // primary feeds are misbehaving.
  const ethUsd = parseFloat(process.env.FALLBACK_ETH_USD || "0");
  const gnoUsd = parseFloat(process.env.FALLBACK_GNO_USD || "0");
  if (!ethUsd && !gnoUsd) return null;
  return { ethUsd, gnoUsd, asOf: new Date().toISOString(), source: "env" };
}

export const fetchPrices = cache(async (): Promise<Prices> => {
  const cg = await fromCoingecko();
  if (cg) return cg;
  const cb = await fromCoinbase();
  if (cb) {
    // Stitch in Gnosis from a static fallback if Coinbase only gave us ETH.
    if (!cb.gnoUsd) {
      const env = fromEnv();
      if (env?.gnoUsd) cb.gnoUsd = env.gnoUsd;
    }
    return cb;
  }
  const env = fromEnv();
  if (env) return env;
  return FALLBACK;
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
