import { AddressForm } from "@/components/AddressForm";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="text-center pt-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-text to-muted bg-clip-text text-transparent">
          See every vault you're staking in.
        </h1>
        <p className="mt-4 text-muted max-w-2xl mx-auto">
          Paste any wallet address and get a single view of every StakeWise V3 position across
          Mainnet and Gnosis — stake, lifetime rewards, current APY, osETH minted, share of TVL.
        </p>
        <p className="mt-2 text-xs text-dim">
          No connection, no signing, no API key. Pure read-only against StakeWise's own graph nodes.
        </p>
      </section>

      <section className="mx-auto max-w-2xl">
        <AddressForm />
      </section>

      <section className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-6">
        <Feature title="All your vaults" body="Including private ones you've been allow-listed into. One row per active position." />
        <Feature title="Both networks" body="Mainnet + Gnosis fetched in parallel and merged into one view." />
        <Feature title="Earnings breakdown" body="Base staking yield vs. boost yield separated out so you can see what's earning what." />
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-panel/50 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted">{body}</div>
    </div>
  );
}
