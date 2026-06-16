import { NextRequest, NextResponse } from "next/server";

// MVP subscription endpoint. v0.2 just acks + logs to stdout. v0.3 will wire
// this to Vercel KV (or Upstash Redis) + a hourly cron route + Resend/Discord
// notification. Schema is intentionally stable so v0.3 can migrate cleanly.
export async function POST(req: NextRequest) {
  let body: { address?: string; contact?: string; trigger?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const address = (body.address || "").trim().toLowerCase();
  const contact = (body.contact || "").trim();
  const trigger = (body.trigger || "").trim();
  if (!/^0x[a-f0-9]{40}$/.test(address)) return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  if (!contact) return NextResponse.json({ error: "missing_contact" }, { status: 400 });
  if (!["withdrawal_ready", "apy_drop", "any_event"].includes(trigger)) {
    return NextResponse.json({ error: "invalid_trigger" }, { status: 400 });
  }
  // TODO(v0.3): persist to KV under key `alerts:{address}:{contactHash}` with TTL
  console.log(`[alerts] subscribe address=${address} trigger=${trigger} contact-redacted=${redact(contact)}`);
  return NextResponse.json({ ok: true, address, trigger, queued: true });
}

function redact(s: string): string {
  if (s.length <= 6) return "***";
  return `${s.slice(0, 3)}***${s.slice(-3)}`;
}
