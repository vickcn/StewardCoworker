'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  shareToken: string;
  itemId: string;
}

const VISITOR_NAME_KEY = 'steward_public_name';
const VISITOR_NAME_EVENT = 'steward_public_name_change';

export function PublicClaimForm({ shareToken, itemId }: Props) {
  const router = useRouter();
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VISITOR_NAME_KEY);
      if (saved?.trim()) setAuthor(saved.trim());
    } catch {
      // ignore storage errors
    }
  }, []);

  function updateAuthor(value: string) {
    setAuthor(value);
    try {
      const trimmed = value.trim();
      if (trimmed) {
        window.localStorage.setItem(VISITOR_NAME_KEY, trimmed);
      } else {
        window.localStorage.removeItem(VISITOR_NAME_KEY);
      }
      window.dispatchEvent(new CustomEvent(VISITOR_NAME_EVENT, { detail: trimmed }));
    } catch {
      // ignore storage errors
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public/${shareToken}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ADD_CLAIM', itemId, author: author.trim(), note }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '認領失敗');
      }
      try {
        const trimmed = author.trim();
        window.localStorage.setItem(VISITOR_NAME_KEY, trimmed);
        window.dispatchEvent(new CustomEvent(VISITOR_NAME_EVENT, { detail: trimmed }));
      } catch {
        // ignore storage errors
      }
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '認領失敗');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
        <p className="font-medium text-green-800">認領成功！感謝你的參與 🎉</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-900">認領此品項</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">你的名字 *</label>
          <input
            required
            value={author}
            onChange={(e) => updateAuthor(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="請輸入你的名字"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">備註（選填）</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !author.trim()}
          className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '提交中...' : '確認認領'}
        </button>
      </form>
    </div>
  );
}
