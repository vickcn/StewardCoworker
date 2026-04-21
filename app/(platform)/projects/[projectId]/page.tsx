import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { fetchProjectItems } from '@/lib/google/project-integration';
import { computeStats } from '@/lib/data/stats';
import { ItemTable } from '@/components/dashboard/ItemTable';
import { ItemGrid } from '@/components/dashboard/ItemGrid';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import Link from 'next/link';

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  const { projectId } = await params;

  const user = await db.user.findUnique({ where: { email: session!.user!.email! } });
  const member = user
    ? await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      })
    : null;
  if (!member) notFound();

  const integration = await db.projectIntegration.findUnique({ where: { projectId } });
  const hasIntegration = !!(integration?.spreadsheetId && integration.sheetName);

  let items: Awaited<ReturnType<typeof fetchProjectItems>> = [];
  let fetchError = '';
  if (hasIntegration) {
    try {
      items = await fetchProjectItems(projectId);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Failed to load items';
    }
  }

  const stats = computeStats(items);
  const publicShare = await db.projectPublicShare.findUnique({ where: { projectId } });
  const shareUrl = publicShare?.isEnabled
    ? `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/p/${publicShare.shareToken}`
    : null;

  return (
    <div className="space-y-6">
      {shareUrl && (
        <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-green-800">公開分享連結已啟用</p>
            <p className="text-xs text-green-600 mt-0.5 break-all">{shareUrl}</p>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 shrink-0 text-xs text-green-700 underline hover:no-underline"
          >
            預覽
          </a>
        </div>
      )}

      {!hasIntegration && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
          <p className="text-sm font-medium text-yellow-800">尚未設定 Google Sheet</p>
          <Link href={`/projects/${projectId}/settings`} className="text-xs text-yellow-700 underline">
            前往設定
          </Link>
        </div>
      )}

      {fetchError && (
        <p className="text-sm text-red-600">{fetchError}</p>
      )}

      {items.length > 0 && (
        <>
          <DashboardStats {...stats} />
          <ItemGrid items={items} projectId={projectId} />
        </>
      )}
    </div>
  );
}
