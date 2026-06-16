// ENS resolution helpers. Uses viem against a free public Mainnet RPC — no
// API key needed. Results cached per server render.

import { cache } from "react";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { mainnet } from "viem/chains";

const RPC = process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com";

const client = createPublicClient({ chain: mainnet, transport: http(RPC) });

// Resolve a string the user pasted. Could be 0x-address, ENS name, or junk.
// Returns the 0x-address on success, null on failure (so the caller can
// gracefully fall back to "couldn't resolve").
export const resolveAddress = cache(async (input: string): Promise<string | null> => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isAddress(trimmed)) return trimmed.toLowerCase();
  // ENS — must have a dot. Skip obvious junk.
  if (!trimmed.includes(".")) return null;
  try {
    const addr = await client.getEnsAddress({ name: trimmed.toLowerCase() });
    return addr ? addr.toLowerCase() : null;
  } catch {
    return null;
  }
});

// Reverse — for "0xabc..." → "vitalik.eth". Optional; we display it on the
// wallet page header when found.
export const reverseEns = cache(async (address: string): Promise<string | null> => {
  if (!isAddress(address)) return null;
  try {
    return await client.getEnsName({ address: address as Address });
  } catch {
    return null;
  }
});
