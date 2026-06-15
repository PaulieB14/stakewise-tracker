import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-6xl">🛰️</div>
      <h2 className="text-2xl font-semibold">That address didn't look valid.</h2>
      <p className="text-muted">
        Need a 0x-prefixed 40-character hex wallet address.
      </p>
      <Link href="/" className="inline-block rounded-md bg-accent text-bg px-4 py-2 text-sm font-semibold">
        ← Back home
      </Link>
    </div>
  );
}
