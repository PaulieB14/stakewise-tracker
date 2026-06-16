import { Sparkline, snapshotsWindowed, sumEarnedWei } from "@/components/Sparkline";
import { VaultActivity } from "@/components/VaultActivity";
import { WithdrawalStatus } from "@/components/WithdrawalStatus";
import { Prices, formatUsd, priceForNetwork } from "@/lib/prices";
import { VaultPosition, explorerAddress, formatAssets, formatNative, nativeSymbol, weiToNumber } from "@/lib/stakewise";

export function PositionRow({ p, address, prices }: { p: VaultPosition; address: string; prices: Prices }) {
  const sym = nativeSymbol(p.network);
  const price = priceForNetwork(prices, p.network);
  // Primary Cells (stake + earned total) render at text-2xl in a 4-col grid;
  // whales (27k ETH) overflow at default 4dp. compact mode caps decimals by
  // magnitude — preserves dust precision on small positions, avoids the
  // mash-up at scale.
  const stake = formatNative(p.assets, { mode: "compact", zeroPlaceholder: "—" });
  const stakeUsd = price > 0 ? weiToNumber(p.assets) * price : 0;
  const earned = formatNative(p.totalEarnedAssets, { mode: "compact" });
  const earnedUsd = price > 0 ? weiToNumber(p.totalEarnedAssets) * price : 0;
  // SplitCell stays on legacy formatAssets — narrow columns, no overflow risk.
  const earnedStake = formatAssets(p.totalStakeEarnedAssets);
  const earnedBoost = formatAssets(p.totalBoostEarnedAssets);
  const osTokenMinted = formatNative(p.mintedOsTokenShares, { mode: "compact" });
  const sharePct = p.shareOfVault * 100;
  const stakewiseVaultUrl = `https://app.stakewise.io/vault/${p.network}/${p.vault.id}`;

  // 30d delta from the sparkline window. snapshotsWindowed is shared with the
  // Sparkline so the chart line and the label can never disagree.
  const window30 = snapshotsWindowed(p.snapshots, 30);
  const sum30Wei = sumEarnedWei(window30);
  const sum30Usd = price > 0 ? weiToNumber(sum30Wei) * price : 0;
  const sum30PerDayWei = window30.length > 0 ? sum30Wei / BigInt(Math.max(1, window30.length)) : 0n;
  const sum30PerDayUsd = price > 0 ? weiToNumber(sum30PerDayWei) * price : 0;

  const hasBoost = p.vault.maxBoostApy > p.vault.baseApy + 0.001;

  return (
    <article id={`vault-${p.vault.id.toLowerCase()}`} className="rounded-xl glass p-5">
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-md bg-panelHi border border-white/[0.06] grid place-items-center overflow-hidden flex-none">
          {p.vault.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.vault.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[11px] font-mono text-dim">{p.vault.id.slice(2, 4).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate text-lg">{p.vault.displayName}</h3>
              <a
                href={explorerAddress(p.network, p.vault.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-dim font-mono tabular-nums truncate hover:text-muted transition"
              >
                {p.vault.id.slice(0, 10)}…{p.vault.id.slice(-6)} <span className="text-dim/70">↗</span>
              </a>
              <span className="ml-2 text-[10px] uppercase tracking-[0.08em] font-mono text-dim">{p.network}</span>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-dim">Your APY</div>
              <div className="font-bold text-2xl tabular-nums text-text leading-none mt-1">
                {p.apy.toFixed(2)}<span className="text-muted text-base">%</span>
              </div>
            </div>
          </div>

          {/* 4-col grid: stake | earned | base/boost split | share */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Cell label={`Stake (${sym})`} value={stake} usd={stakeUsd} primary />
            <Cell label={`Earned total (${sym})`} value={earned} usd={earnedUsd} accentColor="text-accent2" />
            <SplitCell
              label="Stake / Boost"
              base={earnedStake}
              boost={earnedBoost}
              hasBoost={p.totalBoostEarnedAssets > 0n}
              sym={sym}
            />
            <Cell label="Share of vault" value={`${sharePct < 0.0001 ? "<0.0001" : sharePct.toFixed(4)}%`} />
          </div>

          {/* 30d sparkline row — chart + bold delta on left; APY range on right */}
          <div className="mt-5 pt-4 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-dim">30d earnings</span>
                <Sparkline snapshots={p.snapshots} days={30} />
              </div>
              {window30.length >= 2 ? (
                <div className="text-xs tabular-nums flex flex-col gap-0.5">
                  <span className="text-accent2 font-bold text-sm">
                    +{formatNative(sum30Wei, { mode: "compact", zeroPlaceholder: "—" })} {sym}
                  </span>
                  {sum30Usd > 0 && (
                    <span className="text-muted text-xs">{formatUsd(sum30Usd)} · ~{formatUsd(sum30PerDayUsd)}/day</span>
                  )}
                </div>
              ) : null}
            </div>
            <div className="text-xs tabular-nums text-right">
              <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-dim">APY range</div>
              <div className="mt-1">
                <span className="text-dim">Base </span>
                <span className="text-text font-semibold">{p.vault.baseApy.toFixed(2)}%</span>
                {hasBoost && (
                  <>
                    <span className="text-dim mx-1.5">→</span>
                    <span className="text-accent font-semibold">{p.vault.maxBoostApy.toFixed(2)}%</span>
                    <span className="text-dim ml-1">max w/ boost</span>
                  </>
                )}
                {!hasBoost && <span className="text-dim ml-1.5">· no boost</span>}
              </div>
            </div>
          </div>

          {/* Tag row */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Tag>{p.vault.isPrivate ? "Private" : "Public"}</Tag>
            {p.vault.isErc20 && <Tag>ERC-20</Tag>}
            {p.mintedOsTokenShares > 0n && <Tag>osToken minted: {osTokenMinted}</Tag>}
            {p.exitingAssets > 0n && <Tag color="text-warn">Exiting: {formatNative(p.exitingAssets, { mode: "compact" })} {sym}</Tag>}
          </div>

          <WithdrawalStatus requests={p.exitRequests} network={p.network} vaultId={p.vault.id} />

          <VaultActivity
            network={p.network}
            vaultId={p.vault.id}
            vaultTotalAssets={p.vault.totalAssets}
            userAddress={address}
          />

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <a className="text-accent hover:underline font-medium" href={stakewiseVaultUrl} target="_blank" rel="noopener noreferrer">Open in StakeWise ↗</a>
            <a className="text-muted hover:text-text underline-offset-2 hover:underline" href={explorerAddress(p.network, address)} target="_blank" rel="noopener noreferrer">Your tx history ↗</a>
          </div>
        </div>
      </div>
    </article>
  );
}

function Cell({ label, value, usd, primary, accentColor }: { label: string; value: string; usd?: number; primary?: boolean; accentColor?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-dim">{label}</div>
      <div className={`${primary ? "text-2xl" : "text-lg"} font-bold ${accentColor ?? "text-text"} tabular-nums leading-tight mt-1`}>
        {value}
      </div>
      {usd !== undefined && usd > 0 && (
        <div className="text-sm text-muted font-medium tabular-nums mt-0.5">{formatUsd(usd)}</div>
      )}
    </div>
  );
}

// Stake yield in white, boost yield in purple — establishes the
// base=white / boost=purple / earned=teal semantic across the page.
// Renders "base only" when boost = 0 to avoid the awkward "583 / 0" display.
function SplitCell({ label, base, boost, hasBoost, sym }: { label: string; base: string; boost: string; hasBoost: boolean; sym: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-dim">{label}</div>
      {hasBoost ? (
        <>
          <div className="mt-1 flex items-baseline gap-1.5 text-base font-semibold tabular-nums leading-tight">
            <span className="text-text">{base}</span>
            <span className="text-dim/70 text-sm">/</span>
            <span className="text-accent">{boost}</span>
          </div>
          <div className="text-[11px] text-dim mt-0.5 font-mono">{sym} · base / boost</div>
        </>
      ) : (
        <>
          <div className="mt-1 text-base font-semibold tabular-nums leading-tight text-text">
            {base}
          </div>
          <div className="text-[11px] text-dim mt-0.5 font-mono">{sym} · base only</div>
        </>
      )}
    </div>
  );
}

function Tag({ children, color = "" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full bg-panelHi border border-white/[0.05] text-[11px] ${color}`}>
      {children}
    </span>
  );
}
