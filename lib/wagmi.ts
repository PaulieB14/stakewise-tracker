import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";

// Wagmi v2 config. Mainnet only — we only need the user's address for
// auto-fill, not chain interaction (positions render server-side via
// StakeWise's graph nodes).
//
// EIP-6963 multi-injected provider discovery is ON by default in wagmi v2
// (multiInjectedProviderDiscovery: true), so Rabby, MetaMask, Rainbow,
// Frame, Brave, OKX, etc. enumerate automatically — no per-wallet
// connector import needed.
//
// `ssr: true` is required for Next.js App Router: it stops wagmi from
// trying to read browser state during server render and avoids hydration
// mismatch on useAccount/useConnectors.
export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
  },
  ssr: true,
});
