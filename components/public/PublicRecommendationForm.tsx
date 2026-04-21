'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  shareToken: string;
  itemId: string;
}

export function PublicRecommendationForm({ shareToken, itemId }: Props) {
  const router = useRouter();
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public/${shareToken}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ADD_RECOMMENDATION', itemId, author, title, url, note }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '提交失敗');
      }
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失敗');
    } finally {
      setLoading(false);
    }
  }

  if (done) return <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">推薦連結已提交！</p>;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-900">推薦購買連結</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">你的名稱 *</label>
            <input required value={author} onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">品名/描述 *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">連結網址 *</label>
          <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">備註（選填）</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? '提交中...' : '提交推薦'}
        </button>
      </form>
    </div>
  );
}
