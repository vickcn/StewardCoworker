import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getCallerRole(projectId: string, email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
    include: { project: true },
  });
  return member ?? null;
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  const { projectId } = await params;
  const member = await getCallerRole(projectId, session!.user!.email!);
  if (!member) notFound();

  const { project, role } = member;
  const isAdmin = role === 'OWNER' || role === 'ADMIN';

  const navLinks = [
    { href: `/projects/${projectId}`, label: '品項總覽' },
    ...(isAdmin ? [
      { href: `/projects/${projectId}/members`, label: '成員管理' },
      { href: `/projects/${projectId}/settings`, label: '設定' },
    ] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/projects" className="text-sm text-blue-600 hover:underline">← 所有專案</Link>
          <h1 className="mt-1 text-xl font-bold text-gray-900">{project.name}</h1>
          {project.eventDate && (
            <p className="text-sm text-gray-500">活動日期：{project.eventDate}</p>
          )}
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">{role}</span>
      </div>

      <nav className="flex gap-1 border-b border-gray-200">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-blue-500 -mb-px"
          >
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
