import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { PlatformNav } from '@/components/platform/PlatformNav';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/api/auth/signin');

  return (
    <div className="min-h-screen flex flex-col">
      <PlatformNav user={session.user} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
