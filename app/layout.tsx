import type { Metadata } from "next";
import { HeaderPriceChip } from "@/components/HeaderPriceChip";
import { Logo } from "@/components/Logo";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://stakewise-tracker.vercel.app"),
  title: "StakeWise Tracker — every vault, one view",
  description:
    "Multi-vault dashboard for StakeWise V3 stakers. Paste any wallet — see every position on Mainnet + Gnosis. Read-only, no wallet connect.",
  openGraph: {
    title: "StakeWise Tracker",
    description: "Every StakeWise V3 vault you're staking in, one view.",
    type: "website",
    siteName: "StakeWise Tracker",
    url: "https://stakewise-tracker.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "StakeWise Tracker — every vault, one view",
    description: "Multi-vault dashboard for StakeWise V3 stakers.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#060912]/70 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <Logo size={26} />
              <div className="flex items-baseline gap-2">
                <span className="font-semibold tracking-tight text-base">StakeWise Tracker</span>
                <span className="text-[11px] text-dim hidden sm:inline">multi-vault · multi-network</span>
              </div>
            </a>
            <nav className="text-xs text-muted flex items-center gap-3 sm:gap-5">
              <HeaderPriceChip />
              <a href="https://app.stakewise.io" target="_blank" rel="noopener noreferrer" className="hover:text-text transition hidden sm:inline">
                StakeWise app ↗
              </a>
              <a href="https://docs.stakewise.io" target="_blank" rel="noopener noreferrer" className="hover:text-text transition hidden sm:inline">
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
          <p className="text-dim/70">Read-only · optional wallet connect for auto-fill · no signing · no analytics.</p>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
