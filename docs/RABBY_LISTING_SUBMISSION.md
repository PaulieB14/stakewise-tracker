# Rabby Discover listing submission

The dApp directory inside Rabby Wallet's "Discover" tab is fetched at runtime
from `api.rabby.io/v1/dapp/list`, which is sourced from DeBank's backend.
There is **no public GitHub registry** to PR — the previous guess of
`github.com/RabbyHub/rabby-config` does not exist (all 36 RabbyHub repos
audited 2026-06-16).

The submission flow has two parallel tracks. Run both the same day; whichever
lands first gets us in.

---

## Tier 1 — DeBank Official Account (primary, documented, ~7 business day SLA)

Rabby Discover ingests from DeBank's backend. The only documented path to get
on DeBank's index is the Official Account flow.

1. Open https://official.debank.com/
2. Sign up. Use one of:
   - **Preferred**: email at a project domain (faster verification via DNS match)
   - **Alternative**: verified X/Twitter handle (link the @graphtronauts_c account in account settings, then DeBank verifies via a tweet from that handle)
3. In the console, click **Create**, then fill the Official Account form:

   | Field | Value to submit |
   |---|---|
   | Official account name | **`StakeWise Tracker`** ⚠️ this is **immutable** after approval |
   | Logo | 512×512 transparent PNG of the ETH-diamond logo + "StakeWise Tracker" wordmark. SVG sometimes gets rejected — have a PNG ready as backup. |
   | Description | Multi-vault dashboard for StakeWise V3 stakers. Paste any wallet — see every position on Mainnet + Gnosis (stake, lifetime rewards, APY, osETH minted, share of TVL, withdrawal status). Read-only. |
   | Production URL | `https://stakewise-tracker.vercel.app` |
   | GitHub | `https://github.com/PaulieB14/stakewise-tracker` |
   | X handle | `@graphtronauts_c` |
   | Category | `DeFi` (or `Yield` if presented as an option) |

4. DeBank verifies (~7 business days). On approval:
   - Logo gets a CID at `static.debank.com/image/dapp/logo_url/<hash>/<hash>.png`
   - The entry shows up in `api.rabby.io/v1/dapp/search?q=stakewise` within hours of the DeBank approval (ingestion is automatic but undocumented)

**Caveat**: DeBank Official Account → Rabby Discover ingestion is *inferred*
from the shared backend, **not contractually documented**. Tier 2 is the
insurance policy — do not skip it even if Tier 1 looks sufficient.

---

## Tier 2 — Direct outreach to Rabby team (insurance, no SLA)

Send the same metadata via three channels in parallel:

### A. Email
- **To**: `support@rabby.io`
- **Subject**: `Rabby Discover submission: StakeWise Tracker`
- **Body**:
  ```
  Hi Rabby team,

  Requesting addition to Rabby Discover for an independent multi-vault
  dashboard built for StakeWise V3 stakers.

  - Name: StakeWise Tracker
  - URL: https://stakewise-tracker.vercel.app
  - GitHub: https://github.com/PaulieB14/stakewise-tracker
  - Logo: [hosted URL — Vercel-served PNG]
  - Description (EN): Multi-vault dashboard for StakeWise V3 stakers.
    Paste any wallet — see every position on Mainnet + Gnosis (stake,
    lifetime rewards, APY, osETH minted, share of TVL, withdrawal
    status). Read-only.
  - Category: DeFi
  - Supported chains: Ethereum mainnet, Gnosis
  - DeBank Official Account submission filed [DATE]
  - Wallet connect: EIP-6963 (wagmi v2) — read-only, no signing

  Happy to provide any additional metadata.

  Thanks,
  Paul (graphtronauts.eth · @graphtronauts_c)
  ```

### B. Discord
- Join https://discord.com/invite/seFBCWmUre
- Post the same body in `#general` or whichever channel matches dApp discovery
- Historically the fastest response channel

### C. Direct DeBank message
- https://debank.com/hi/0a110032 → send the same body

---

## What to expect

| Channel | SLA | Reality |
|---|---|---|
| DeBank Official Account | 7 business days documented | Usually 5–10 days |
| support@rabby.io | none documented | 1–14 days historically |
| Discord | informal | Hours to a few days if a maintainer is active |

If nothing responds in 10 business days, re-ping Discord referencing the
original ticket numbers.

---

## Post-approval verification

Once any channel confirms approval:

```bash
curl -s 'https://api.rabby.io/v1/dapp/search?q=stakewise+tracker' | jq .
```

The entry should appear with the submitted logo URL. If the logo resolves to
`static.debank.com/image/dapp/logo_url/<hash>/<hash>.png`, the DeBank → Rabby
ingestion fired correctly.

---

## NOT this path

Do NOT open a PR to `RabbyHub/rabby-mobile/apps/mobile/src/constant/hot-dapp.json`.

- That file controls the Rabby **mobile** home drawer only (66 hard-coded entries)
- No `CONTRIBUTING.md`, no community-PR pattern in git history → looks curator-only
- The git-policy memory rules out PRs to external repos without explicit ask
