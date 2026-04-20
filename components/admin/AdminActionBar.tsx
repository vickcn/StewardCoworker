import Link from 'next/link';
export function AdminActionBar() { return <div className='flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-4'><div className='text-sm text-stone-600'>管理工具列</div><Link href='/admin/items' className='text-sm text-amber-700 underline'>返回項目列表</Link></div>; }
