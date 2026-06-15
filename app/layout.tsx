import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StakeWise Tracker — see every vault you're staking in",
  description:
    "An independent multi-vault dashboard for StakeWise V3 stakers. Paste any wallet address and see every position across every vault (Mainnet + Gnosis) in one view — stake, earned rewards, APY, share of TVL.",
  openGraph: {
    title: "StakeWise Tracker",
    description: "Multi-vault staker dashboard for StakeWise V3.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-border/60 bg-panel/40 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <div className="size-7 rounded-md bg-gradient-to-br from-accent to-accent2 grid place-items-center text-bg font-bold text-sm">
                S
              </div>
              <span className="font-semibold tracking-tight">StakeWise Tracker</span>
              <span className="text-xs text-dim hidden sm:inline">· multi-vault staker view</span>
            </a>
            <nav className="text-xs text-muted flex items-center gap-4">
              <a href="https://stakewise.io" target="_blank" rel="noopener noreferrer" className="hover:text-text">
                stakewise.io ↗
              </a>
              <a href="https://docs.stakewise.io" target="_blank" rel="noopener noreferrer" className="hover:text-text">
                docs ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-dim">
          <p>
            Independent dashboard. Data pulled from StakeWise's self-hosted graph nodes
            (<a href="https://graphs.stakewise.io" className="underline hover:text-text">graphs.stakewise.io</a>).
            Not affiliated with StakeWise.
          </p>
          <p className="mt-1">
            Built because the official wallet panel hides vault deposits behind navigation.
          </p>
        </footer>
      </body>
    </html>
  );
}
