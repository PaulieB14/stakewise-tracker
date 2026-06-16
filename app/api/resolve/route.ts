import { resolveAddress } from "@/lib/ens";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "missing name" }, { status: 400 });
  try {
    const addr = await resolveAddress(name);
    if (!addr) return NextResponse.json({ error: "not_resolved" }, { status: 404 });
    return NextResponse.json({ address: addr });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
