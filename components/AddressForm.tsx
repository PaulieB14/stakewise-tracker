"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";

export function AddressForm({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(defaultValue);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = v.trim();
    if (!s) {
      setErr("Paste a wallet address or ENS name.");
      return;
    }
    setErr(null);
    // 0x address — go directly.
    if (/^0x[a-fA-F0-9]{40}$/.test(s)) {
      start(() => router.push(`/wallet/${s.toLowerCase()}`));
      return;
    }
    // ENS — resolve via our server endpoint so we don't ship viem to the client bundle.
    if (s.includes(".") && s.length > 3) {
      try {
        const r = await fetch(`/api/resolve?name=${encodeURIComponent(s)}`, { cache: "no-store" });
        const j = (await r.json()) as { address?: string; error?: string };
        if (j.address) {
          start(() => router.push(`/wallet/${j.address!.toLowerCase()}`));
          return;
        }
        setErr(j.error || `Couldn't resolve "${s}". Try the 0x address directly.`);
        return;
      } catch {
        setErr("ENS lookup failed. Try the 0x address directly.");
        return;
      }
    }
    setErr("That doesn't look like a wallet address. Need 0x… (40 hex) or a .eth name.");
  }

  return (
    <div className="space-y-3">
      <ConnectWallet onAddress={(a) => start(() => router.push(`/wallet/${a.toLowerCase()}`))} />
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-dim/80">
        <span className="h-px flex-1 bg-white/[0.06]" />
        <span>or paste an address</span>
        <span className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
        type="text"
        inputMode="text"
        placeholder="0x… or vitalik.eth"
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        value={v}
        onChange={(e) => setV(e.target.value)}
        disabled={pending}
        className="flex-1 rounded-xl bg-[#0b1020]/80 border border-white/10 focus:border-accent focus:bg-[#0b1020] outline-none px-4 py-3.5 font-mono text-sm placeholder:text-dim disabled:opacity-60"
      />
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-r from-accent to-accent/80 text-white font-semibold px-5 hover:brightness-110 active:brightness-95 transition disabled:opacity-50 shadow-lg shadow-accent/20"
        disabled={!v.trim() || pending}
      >
        {pending ? "…" : "Look up"}
      </button>
        {err ? <div className="absolute mt-14 text-xs text-danger">{err}</div> : null}
      </form>
    </div>
  );
}
