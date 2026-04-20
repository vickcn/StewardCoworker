import Link from 'next/link';
export function Navbar() {
  return (
    <nav className="border-b border-[var(--border)] bg-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">SpringRoll Steward</Link>
        <div className="flex gap-4 text-sm text-stone-600">
          <Link href="/">首頁</Link>
          <Link href="/admin">管理</Link>
        </div>
      </div>
    </nav>
  );
}
