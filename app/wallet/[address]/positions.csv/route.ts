import { fetchPrices, priceForNetwork } from "@/lib/prices";
import { VaultPosition, earningsInYear, fetchAllPositions, formatAssets, isValidAddress, nativeSymbol, weiToNumber } from "@/lib/stakewise";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// /wallet/0x.../positions.csv               -> lifetime totals
// /wallet/0x.../positions.csv?year=2026     -> just earnings inside that calendar year (tax-friendly)
export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw).toLowerCase();
  if (!isValidAddress(address)) return new NextResponse("invalid address", { status: 400 });

  const url = new URL(req.url);
  const yearRaw = url.searchParams.get("year");
  const yearNum = yearRaw ? parseInt(yearRaw, 10) : 0;
  const now = new Date();
  const inYearMode = Number.isFinite(yearNum) && yearNum >= 2020 && yearNum <= now.getUTCFullYear();

  const [positions, prices] = await Promise.all([fetchAllPositions(address), fetchPrices()]);

  const lines: string[] = [];
  if (inYearMode) {
    lines.push("network,vault_id,vault_name,native_symbol,earned_in_year,from_stake_in_year,from_boost_in_year,earned_in_year_usd,snapshot_days_in_year,first_snapshot_iso,last_snapshot_iso,price_used_usd");
    for (const p of positions) {
      const sym = nativeSymbol(p.network);
      const y = earningsInYear(p.snapshots, yearNum);
      const price = priceForNetwork(prices, p.network);
      const earnedUsd = price > 0 ? weiToNumber(y.earned) * price : 0;
      const firstIso = y.firstSnapshot ? new Date(y.firstSnapshot * 1000).toISOString() : "";
      const lastIso = y.lastSnapshot ? new Date(y.lastSnapshot * 1000).toISOString() : "";
      lines.push([
        p.network,
        p.vault.id,
        csvField(p.vault.displayName),
        sym,
        formatAssets(y.earned, 18, 8),
        formatAssets(y.fromStake, 18, 8),
        formatAssets(y.fromBoost, 18, 8),
        earnedUsd.toFixed(2),
        y.snapshotCount.toString(),
        firstIso,
        lastIso,
        price.toFixed(2),
      ].join(","));
    }
  } else {
    lines.push("network,vault_id,vault_name,native_symbol,stake,stake_usd,lifetime_earned,from_stake,from_boost,lifetime_earned_usd,your_apy_pct,vault_apy_pct,share_of_vault_pct,exiting,ostoken_minted,price_used_usd");
    for (const p of positions) {
      const sym = nativeSymbol(p.network);
      const price = priceForNetwork(prices, p.network);
      const stakeUsd = price > 0 ? weiToNumber(p.assets) * price : 0;
      const earnedUsd = price > 0 ? weiToNumber(p.totalEarnedAssets) * price : 0;
      lines.push([
        p.network,
        p.vault.id,
        csvField(p.vault.displayName),
        sym,
        formatAssets(p.assets, 18, 8),
        stakeUsd.toFixed(2),
        formatAssets(p.totalEarnedAssets, 18, 8),
        formatAssets(p.totalStakeEarnedAssets, 18, 8),
        formatAssets(p.totalBoostEarnedAssets, 18, 8),
        earnedUsd.toFixed(2),
        p.apy.toFixed(4),
        p.vault.apy.toFixed(4),
        (p.shareOfVault * 100).toFixed(6),
        formatAssets(p.exitingAssets, 18, 8),
        formatAssets(p.mintedOsTokenShares, 18, 8),
        price.toFixed(2),
      ].join(","));
    }
  }

  const filename = inYearMode
    ? `stakewise-${address.slice(0, 10)}-${yearNum}.csv`
    : `stakewise-${address.slice(0, 10)}-lifetime.csv`;

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, max-age=60",
    },
  });
}

function csvField(s: string | null | undefined): string {
  const v = s ?? "";
  if (/[,"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
