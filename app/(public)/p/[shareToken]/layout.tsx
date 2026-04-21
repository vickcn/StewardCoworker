import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function PublicProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const share = await db.projectPublicShare.findUnique({
    where: { shareToken },
    include: { project: true },
  });
  if (!share || !share.isEnabled) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">{share.project.name}</h1>
            {share.project.eventDate && (
              <p className="text-xs text-gray-500">活動日期：{share.project.eventDate}</p>
            )}
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            公開訪客模式
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
