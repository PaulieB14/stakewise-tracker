import { fetchPrices, formatUsd, priceForNetwork } from "@/lib/prices";
import { fetchAllPositions, formatAssets, isValidAddress, nativeSymbol, weiToNumber } from "@/lib/stakewise";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "StakeWise Tracker — multi-vault staker dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw).toLowerCase();
  if (!isValidAddress(address)) {
    return new ImageResponse(<Fallback msg="StakeWise Tracker" />, { ...size });
  }

  const [positions, prices] = await Promise.all([fetchAllPositions(address), fetchPrices()]);

  let totalStake = 0n;
  let totalEarned = 0n;
  let stakeUsd = 0;
  let earnedUsd = 0;
  for (const p of positions) {
    totalStake += p.assets;
    totalEarned += p.totalEarnedAssets;
    const price = priceForNetwork(prices, p.network);
    if (price > 0) {
      stakeUsd += weiToNumber(p.assets) * price;
      earnedUsd += weiToNumber(p.totalEarnedAssets) * price;
    }
  }
  // Pick the dominant network for the unit label.
  const primaryNet = positions[0]?.network ?? "mainnet";
  const primarySym = nativeSymbol(primaryNet);
  const stakeStr = formatAssets(totalStake);
  const earnedStr = formatAssets(totalEarned);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0e1a 0%, #1a1330 100%)",
          padding: 64,
          color: "#e6ecf5",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "linear-gradient(135deg, #7c5cff, #2dd4bf)",
              color: "#0a0e1a",
              fontWeight: 800,
              fontSize: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            S
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>StakeWise Tracker</div>
        </div>

        <div style={{ marginTop: 40, fontSize: 24, color: "#9aa6bc", display: "flex" }}>
          {address.slice(0, 10)}…{address.slice(-8)}
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, color: "#9aa6bc" }}>Total staked</div>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, marginTop: 8, display: "flex" }}>
              {stakeStr} <span style={{ fontSize: 36, marginLeft: 12, color: "#9aa6bc", alignSelf: "flex-end" }}>{primarySym}</span>
            </div>
            {stakeUsd > 0 && <div style={{ fontSize: 28, color: "#9aa6bc", marginTop: 8, display: "flex" }}>{formatUsd(stakeUsd)}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, color: "#9aa6bc" }}>Lifetime earned</div>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, marginTop: 8, color: "#2dd4bf", display: "flex" }}>
              {earnedStr} <span style={{ fontSize: 36, marginLeft: 12, color: "#9aa6bc", alignSelf: "flex-end" }}>{primarySym}</span>
            </div>
            {earnedUsd > 0 && <div style={{ fontSize: 28, color: "#9aa6bc", marginTop: 8, display: "flex" }}>{formatUsd(earnedUsd)}</div>}
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, color: "#9aa6bc", display: "flex" }}>
            {positions.length} active vault{positions.length === 1 ? "" : "s"} across StakeWise V3
          </div>
          <div style={{ fontSize: 20, color: "#6b7693" }}>stakewise-tracker.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Fallback({ msg }: { msg: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0e1a",
        color: "#e6ecf5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 60,
        fontWeight: 700,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {msg}
    </div>
  );
}
