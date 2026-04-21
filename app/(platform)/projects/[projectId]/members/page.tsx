'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ProjectMemberInfo } from '@/types/project';

export default function MembersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [members, setMembers] = useState<ProjectMemberInfo[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadMembers() {
    const res = await fetch(`/api/projects/${projectId}/members`);
    const data = await res.json();
    if (data.data) setMembers(data.data);
  }

  useEffect(() => { loadMembers(); }, [projectId]);

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '邀請失敗');
      setInviteEmail('');
      setMessage(`已新增 ${inviteEmail}`);
      await loadMembers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '邀請失敗');
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(userId: string) {
    if (!confirm('確定要移除此成員？')) return;
    await fetch(`/api/projects/${projectId}/members?userId=${userId}`, { method: 'DELETE' });
    await loadMembers();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">邀請成員</h2>
        <form onSubmit={inviteMember} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            placeholder="輸入 email"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="MEMBER">MEMBER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            邀請
          </button>
        </form>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold px-6 py-4 border-b border-gray-200">成員列表</h2>
        <ul className="divide-y divide-gray-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name ?? m.email}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{m.role}</span>
                {m.role !== 'OWNER' && (
                  <button
                    onClick={() => removeMember(m.userId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    移除
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
