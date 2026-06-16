"use client";

import { useState } from "react";

export function AlertsCard({ address }: { address: string }) {
  const [contact, setContact] = useState("");
  const [trigger, setTrigger] = useState<"apy_drop" | "withdrawal_ready" | "any_event">("withdrawal_ready");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) {
      setErr("Add an email, Telegram handle, or Discord webhook URL.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, contact: contact.trim(), trigger }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setDone(true);
    } catch (e) {
      setErr("Couldn't save subscription. Try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-accent2 animate-pulse" />
        <h3 className="font-semibold">Get pinged when something changes</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-dim/80 bg-accent/10 text-accent/90 px-2 py-0.5 rounded-full">Beta</span>
      </div>
      {done ? (
        <p className="mt-3 text-sm text-accent2">
          ✓ Saved. You'll get pinged on the next sweep when your trigger fires.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as typeof trigger)}
              disabled={busy}
              className="rounded-lg bg-[#0b1020] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="withdrawal_ready">When a withdrawal becomes claimable</option>
              <option value="apy_drop">When my vault APY drops &gt; 0.5%</option>
              <option value="any_event">Any change (daily digest)</option>
            </select>
            <input
              type="text"
              placeholder="email · @handle · webhook URL"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={busy}
              className="rounded-lg bg-[#0b1020] border border-white/10 px-3 py-2.5 text-sm font-mono outline-none focus:border-accent placeholder:text-dim"
            />
          </div>
          {err && <div className="text-xs text-danger">{err}</div>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-dim">
              Stored at-rest only. Cron sweep runs hourly (alerts v0.3) — saving now reserves your slot.
            </p>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-accent text-white font-semibold px-4 py-2 text-sm hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Subscribe"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
