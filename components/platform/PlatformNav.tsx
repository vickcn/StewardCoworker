'use client';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function PlatformNav({ user }: { user: User }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/projects" className="font-bold text-gray-900 hover:text-blue-600">
          StewardCoworker
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-600 sm:block">{user.name ?? user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  );
}
