import { AdminHeader } from '@/components/admin/AdminHeader';
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className='space-y-6'><AdminHeader />{children}</div>; }
