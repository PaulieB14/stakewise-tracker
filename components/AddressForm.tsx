"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddressForm({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [v, setV] = useState(defaultValue);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = v.trim();
    if (!s) {
      setErr("Paste a wallet address.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(s)) {
      setErr("That doesn't look like a wallet address. Need a 0x-prefixed 40-character hex.");
      return;
    }
    setErr(null);
    router.push(`/wallet/${s.toLowerCase()}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="text"
          placeholder="0x… wallet address"
          autoComplete="off"
          spellCheck={false}
          value={v}
          onChange={(e) => setV(e.target.value)}
          className="flex-1 rounded-lg bg-panel border border-border focus:border-accent outline-none px-4 py-3 font-mono text-sm placeholder:text-dim"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent text-bg font-semibold px-5 hover:brightness-110 transition disabled:opacity-50"
          disabled={!v.trim()}
        >
          Look up
        </button>
      </div>
      {err ? <div className="text-xs text-danger">{err}</div> : null}
    </form>
  );
}
