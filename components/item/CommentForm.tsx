'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  shareToken: string;
  itemId: string;
}

export function CommentForm({ shareToken, itemId }: Props) {
  const router = useRouter();
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public/${shareToken}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ADD_COMMENT', itemId, author: author.trim(), content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '留言失敗');
      }
      setAuthor('');
      setContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '留言失敗');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">留言板</h3>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">你的名字 *</label>
          <input
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">留言內容 *</label>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !author.trim() || !content.trim()}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? '送出中...' : '送出留言'}
        </button>
      </form>
    </div>
  );
}
