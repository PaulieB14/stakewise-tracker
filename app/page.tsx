import { AddressForm } from "@/components/AddressForm";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center pt-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-muted/90 mb-6">
          <span className="size-1.5 rounded-full bg-accent2 animate-pulse" />
          Live · powered by StakeWise's own graph nodes
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-text">
          Every vault.<br className="sm:hidden" /> One view.
        </h1>
        <p className="mt-5 text-muted max-w-2xl mx-auto text-lg">
          The multi-vault dashboard StakeWise didn't ship. Paste any wallet, see every V3 position
          across Mainnet and Gnosis — stake, lifetime rewards, APY, osETH minted, share of TVL,
          withdrawal status. All in one shot.
        </p>
        <p className="mt-3 text-xs text-dim">
          No wallet connect · no signing · no API key · no data stored
        </p>
      </section>

      <section className="mx-auto max-w-2xl">
        <div className="relative shimmer-border rounded-2xl">
          <div className="relative rounded-2xl glass p-2.5">
            <AddressForm autoFocus />
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-dim">
          Try: <code className="text-muted">vitalik.eth</code> · or any address you know stakes here
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
        <Feature
          title="All your vaults"
          body="Public and private. One row per active position with stake, earnings split, share of TVL."
        />
        <Feature
          title="Both networks"
          body="Mainnet + Gnosis fetched in parallel. ETH and GNO with live USD pricing."
        />
        <Feature
          title="Tax-ready CSV"
          body="Lifetime totals or per-calendar-year export with USD-converted earnings."
        />
        <Feature
          title="30-day sparklines"
          body="See how each position is trending without leaving the page."
        />
        <Feature
          title="Withdrawal status"
          body="Active exit requests with progress bar, ETA, and claimable flag."
        />
        <Feature
          title="ENS-aware"
          body="Type your .eth name, get the address resolved server-side."
        />
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl glass p-4 hairline">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted leading-relaxed">{body}</div>
    </div>
  );
}
