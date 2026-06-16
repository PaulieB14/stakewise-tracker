"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import type { Connector } from "wagmi";

interface Props {
  // Optional callback used by AddressForm so the connect path can share its
  // useTransition pending state instead of fighting it. If omitted, the
  // component pushes the route directly.
  onAddress?: (address: `0x${string}`) => void;
  // Compact variant for in-header pill use. Default is the full landing button.
  compact?: boolean;
}

export function ConnectWallet({ onAddress, compact }: Props) {
  const router = useRouter();
  const connectors = useConnectors();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, status } = useAccount();
  const [open, setOpen] = useState(false);
  const navigatedRef = useRef(false);

  // Auto-navigate once on connect. Guarded by useRef so a re-render from
  // any wagmi event (account change, chain change) doesn't re-fire push.
  // Resets on disconnect so reconnect-after-switch-wallet works.
  useEffect(() => {
    if (status === "connected" && address && !navigatedRef.current) {
      navigatedRef.current = true;
      setOpen(false);
      if (onAddress) onAddress(address);
      else router.push(`/wallet/${address.toLowerCase()}`);
    }
    if (status === "disconnected") navigatedRef.current = false;
  }, [status, address, onAddress, router]);

  // Filter to EIP-6963-announced wallets that actually have an icon/name.
  // wagmi includes an "Injected" generic fallback connector with no rdns —
  // hide it if any rdns-keyed wallet is available; show it only as the
  // catch-all when nothing else is announced.
  const announced = connectors.filter((c) => c.id !== "injected");
  const list = announced.length > 0 ? announced : connectors;

  if (status === "connected" && address) {
    return (
      <ConnectedPill
        address={address}
        onDisconnect={() => disconnect()}
        compact={compact}
      />
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-text hover:bg-white/[0.08]"
      >
        Connect ↗
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="group w-full rounded-xl bg-gradient-to-r from-accent/15 via-accent/10 to-accent2/15 hover:from-accent/25 hover:to-accent2/25 border border-white/[0.08] hover:border-accent/40 px-4 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-accent/10"
      >
        <WalletIcon />
        <span className="bg-gradient-to-r from-text to-muted bg-clip-text text-transparent">
          {isPending ? "Connecting…" : "Connect wallet"}
        </span>
        <span className="text-dim text-xs">→ auto-fill</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl glass p-2 shadow-2xl">
          {list.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-1">
              {list.map((c) => (
                <li key={c.uid}>
                  <button
                    type="button"
                    onClick={() => {
                      connect({ connector: c });
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.05] transition text-left"
                  >
                    <WalletAvatar connector={c} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      {c.id && c.id !== "injected" && (
                        <div className="text-[10px] text-dim font-mono truncate">{c.id}</div>
                      )}
                    </div>
                    <span className="text-dim text-xs">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {open && (
        <button
          type="button"
          aria-label="Close"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function ConnectedPill({
  address,
  onDisconnect,
  compact,
}: {
  address: `0x${string}`;
  onDisconnect: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  const router = useRouter();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          compact
            ? "rounded-md border border-accent2/30 bg-accent2/10 px-2.5 py-1 text-[11px] font-mono tabular-nums flex items-center gap-1.5 hover:bg-accent2/15"
            : "rounded-xl border border-accent2/30 bg-accent2/10 px-4 py-3 w-full flex items-center justify-center gap-2 text-sm font-semibold hover:bg-accent2/15 transition"
        }
      >
        <span className="size-1.5 rounded-full bg-accent2 animate-pulse" />
        <span className="font-mono tabular-nums">{short}</span>
        <span className="text-dim text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 rounded-xl glass p-1 shadow-2xl min-w-[200px]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/wallet/${address.toLowerCase()}`);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-white/[0.05] text-sm"
          >
            View positions
          </button>
          <button
            type="button"
            onClick={() => {
              onDisconnect();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-white/[0.05] text-sm text-warn"
          >
            Disconnect
          </button>
        </div>
      )}
      {open && (
        <button
          type="button"
          aria-label="Close"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function WalletAvatar({ connector }: { connector: Connector }) {
  const icon = (connector as { icon?: string }).icon;
  if (icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt="" className="size-7 rounded-md border border-white/10" />
    );
  }
  return (
    <div className="size-7 rounded-md bg-panelHi border border-white/10 grid place-items-center text-[10px] font-mono text-dim">
      {connector.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v2h-1.5a3 3 0 0 0 0 6H20v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.85"
      />
      <circle cx="17.5" cy="11" r="1.2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="px-3 py-4 text-center">
      <div className="text-sm font-semibold">No wallet detected</div>
      <p className="mt-1 text-xs text-dim">
        Install <a href="https://rabby.io" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Rabby</a> or another browser-extension wallet to use auto-fill. You can still paste an address manually below.
      </p>
    </div>
  );
}
