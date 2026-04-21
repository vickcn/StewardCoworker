import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect('/projects');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">StewardCoworker</h1>
        <p className="text-lg text-gray-600">多專案總務協作平台</p>
        <p className="text-sm text-gray-500">
          登入後可建立與管理多個總務專案，並生成公開分享連結供協作夥伴認領品項。
        </p>
        <Link
          href="/api/auth/signin"
          className="inline-block rounded-xl bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-700"
        >
          使用 Google 帳號登入
        </Link>
      </div>
    </div>
  );
}
