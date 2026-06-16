import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "StakeWise Tracker — every vault, one view",
  description:
    "Independent multi-vault dashboard for StakeWise V3 stakers. Paste any wallet → every position across Mainnet + Gnosis: stake, lifetime rewards, APY, osETH minted, share of TVL, withdrawal status. ETH-coded. Read-only.",
  openGraph: {
    title: "StakeWise Tracker",
    description: "Every StakeWise V3 vault you're staking in, one view.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#060912]/70 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <Logo size={26} />
              <div className="flex items-baseline gap-2">
                <span className="font-semibold tracking-tight text-base">StakeWise Tracker</span>
                <span className="text-[11px] text-dim hidden sm:inline">multi-vault · multi-network</span>
              </div>
            </a>
            <nav className="text-xs text-muted flex items-center gap-5">
              <a href="https://app.stakewise.io" target="_blank" rel="noopener noreferrer" className="hover:text-text transition">
                StakeWise app ↗
              </a>
              <a href="https://docs.stakewise.io" target="_blank" rel="noopener noreferrer" className="hover:text-text transition">
                Docs ↗
              </a>
              <a href="https://github.com/PaulieB14/stakewise-tracker" target="_blank" rel="noopener noreferrer" className="hover:text-text transition">
                GitHub ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-12 text-center text-xs text-dim space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted/80">
            <Logo size={14} />
            <span className="font-medium tracking-tight">StakeWise Tracker</span>
          </div>
          <p>
            Independent dashboard. Data from StakeWise's own graph nodes
            (<a href="https://graphs.stakewise.io" className="underline decoration-dotted underline-offset-2 hover:text-text">graphs.stakewise.io</a>).
            Not affiliated with StakeWise.
          </p>
          <p className="text-dim/70">Read-only · no wallet connect · no signing · no analytics.</p>
        </footer>
      </body>
    </html>
  );
}
