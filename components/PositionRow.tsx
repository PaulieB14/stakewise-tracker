import { Sparkline } from "@/components/Sparkline";
import { WithdrawalStatus } from "@/components/WithdrawalStatus";
import { Prices, formatUsd, priceForNetwork } from "@/lib/prices";
import { VaultPosition, explorerAddress, formatAssets, nativeSymbol, weiToNumber } from "@/lib/stakewise";

export function PositionRow({ p, address, prices }: { p: VaultPosition; address: string; prices: Prices }) {
  const sym = nativeSymbol(p.network);
  const price = priceForNetwork(prices, p.network);
  const stake = formatAssets(p.assets);
  const stakeUsd = price > 0 ? weiToNumber(p.assets) * price : 0;
  const earned = formatAssets(p.totalEarnedAssets);
  const earnedUsd = price > 0 ? weiToNumber(p.totalEarnedAssets) * price : 0;
  const earnedStake = formatAssets(p.totalStakeEarnedAssets);
  const earnedBoost = formatAssets(p.totalBoostEarnedAssets);
  const osTokenMinted = formatAssets(p.mintedOsTokenShares);
  const sharePct = p.shareOfVault * 100;
  const stakewiseVaultUrl = `https://app.stakewise.io/vault/${p.network}/${p.vault.id}`;

  return (
    <article className="rounded-xl border border-border/60 bg-panel/60 hover:bg-panel transition p-4">
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-md bg-panelHi border border-border/60 grid place-items-center overflow-hidden flex-none">
          {p.vault.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.vault.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs font-mono text-dim">{p.vault.id.slice(2, 4).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{p.vault.displayName}</h3>
              <div className="text-xs text-dim font-mono truncate">
                {p.vault.id.slice(0, 10)}…{p.vault.id.slice(-6)} · {p.network}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-dim">Your APY</div>
              <div className="text-accent2 font-bold text-lg tabular-nums">{p.apy.toFixed(2)}%</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Cell label={`Stake (${sym})`} value={stake} usd={stakeUsd} primary />
            <Cell label={`Earned total (${sym})`} value={earned} usd={earnedUsd} accentColor="text-accent2" />
            <Cell label="stake / boost" value={`${earnedStake} / ${earnedBoost}`} mono />
            <Cell label="Share of vault" value={`${sharePct < 0.0001 ? "<0.0001" : sharePct.toFixed(4)}%`} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-dim">30d earnings</span>
              <Sparkline snapshots={p.snapshots} days={30} />
            </div>
            <div className="text-xs text-muted">
              Vault APY range: <span className="text-text">{p.vault.baseApy.toFixed(2)}%</span> → <span className="text-accent">{p.vault.maxBoostApy.toFixed(2)}%</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <Tag>{p.vault.isPrivate ? "Private" : "Public"}</Tag>
            {p.vault.isErc20 && <Tag>ERC-20</Tag>}
            {p.mintedOsTokenShares > 0n && <Tag>osToken minted: {osTokenMinted}</Tag>}
            {p.exitingAssets > 0n && <Tag color="text-warn">Exiting: {formatAssets(p.exitingAssets)} {sym}</Tag>}
          </div>

          <WithdrawalStatus requests={p.exitRequests} network={p.network} vaultId={p.vault.id} />

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <a className="text-accent hover:underline" href={stakewiseVaultUrl} target="_blank" rel="noopener noreferrer">Open in StakeWise ↗</a>
            <a className="text-muted hover:text-text underline-offset-2 hover:underline" href={explorerAddress(p.network, p.vault.id)} target="_blank" rel="noopener noreferrer">Vault on explorer ↗</a>
            <a className="text-muted hover:text-text underline-offset-2 hover:underline" href={explorerAddress(p.network, address)} target="_blank" rel="noopener noreferrer">Your tx history ↗</a>
          </div>
        </div>
      </div>
    </article>
  );
}

function Cell({ label, value, usd, primary, accentColor, mono }: { label: string; value: string; usd?: number; primary?: boolean; accentColor?: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-dim">{label}</div>
      <div className={`${primary ? "text-xl font-bold" : "text-base font-semibold"} ${accentColor ?? "text-text"} ${mono ? "font-mono" : ""} tabular-nums leading-tight`}>
        {value}
      </div>
      {usd !== undefined && usd > 0 && (
        <div className="text-sm text-muted/90 font-medium tabular-nums mt-0.5">{formatUsd(usd)}</div>
      )}
    </div>
  );
}

function Tag({ children, color = "" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full bg-panelHi border border-border/40 text-[11px] ${color}`}>
      {children}
    </span>
  );
}
