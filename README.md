# StakeWise Tracker

Independent multi-vault dashboard for StakeWise V3 stakers. Paste any wallet
address and see every position across every vault on Mainnet + Gnosis in one
view — stake, lifetime rewards, current APY, osToken minted, share of TVL.

**Why this exists.** StakeWise's official wallet panel only shows liquid
tokens (ETH/osETH/SWISE). Active vault deposits live on the vault contract
and you have to navigate to each vault individually to see your position.
This tracker queries every public vault on both networks in a single shot
and gives you the unified view.

## Stack

- Next.js 15 + TypeScript + Tailwind, server-rendered with 60s revalidate
- Queries StakeWise's own graph nodes (`graphs.stakewise.io/{mainnet,gnosis}`)
  directly — no API key, no Graph Network query budget, replica failover
- No wallet connect, no signing, no data stored — pure read-only

## Develop

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and paste any wallet address.

## Not affiliated with StakeWise.
