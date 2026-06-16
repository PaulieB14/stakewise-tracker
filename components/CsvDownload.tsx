"use client";

import { useState } from "react";

export function CsvDownload({ address }: { address: string }) {
  const now = new Date().getUTCFullYear();
  const years = Array.from({ length: 5 }, (_, i) => now - i);
  const [year, setYear] = useState<"lifetime" | number>("lifetime");

  const href =
    year === "lifetime"
      ? `/wallet/${address}/positions.csv`
      : `/wallet/${address}/positions.csv?year=${year}`;

  return (
    <section className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Export CSV</h3>
        <span className="text-[10px] uppercase tracking-wider text-dim/80 bg-accent2/10 text-accent2/90 px-2 py-0.5 rounded-full">Tax-ready</span>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Lifetime snapshot, or filter to a single calendar year for tax reporting.
        Earnings are converted to USD using the current spot price; pair with the
        snapshot timestamps in the CSV for precise per-tx pricing.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={String(year)}
          onChange={(e) => {
            const v = e.target.value;
            setYear(v === "lifetime" ? "lifetime" : parseInt(v, 10));
          }}
          className="rounded-lg bg-[#0b1020] border border-white/10 px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="lifetime">Lifetime totals</option>
          {years.map((y) => (
            <option key={y} value={y}>{y} (tax year)</option>
          ))}
        </select>
        <a
          href={href}
          className="rounded-lg bg-accent2 text-bg font-semibold px-4 py-2 text-sm hover:brightness-110"
        >
          Download CSV
        </a>
      </div>
    </section>
  );
}
