import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '我的專案 | StewardCoworker' };

export default async function ProjectsPage() {
  const session = await auth();
  const user = await db.user.findUnique({ where: { email: session!.user!.email! } });

  const memberships = user
    ? await db.projectMember.findMany({
        where: { userId: user.id },
        include: { project: { include: { publicShare: true } } },
        orderBy: { project: { updatedAt: 'desc' } },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的專案</h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 建立專案
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          <p className="text-lg font-medium">尚無專案</p>
          <p className="mt-1 text-sm">點擊「建立專案」來開始</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ project, role }) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-semibold text-gray-900 line-clamp-2">{project.name}</h2>
                  <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {role}
                  </span>
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                )}
                {project.eventDate && (
                  <p className="mt-2 text-xs text-gray-400">活動日期：{project.eventDate}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {project.publicShare?.isEnabled && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      公開分享中
                    </span>
                  )}
                  {project.isArchived && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      已封存
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
