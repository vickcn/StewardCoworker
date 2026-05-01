'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ItemRecord } from '@/types/item';

export default function PlatformItemEditPage() {
  const { projectId, itemId } = useParams<{ projectId: string; itemId: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [itemName, setItemName] = useState('');
  const [claimant, setClaimant] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [recAuthor, setRecAuthor] = useState('');
  const [recTitle, setRecTitle] = useState('');
  const [recUrl, setRecUrl] = useState('');
  const [recNote, setRecNote] = useState('');
  const [recSaving, setRecSaving] = useState(false);
  const [recMessage, setRecMessage] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${projectId}/items/${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setItem(data.data);
          setItemName(data.data.itemName);
          setClaimant(data.data.claimant ?? '');
        }
      });
  }, [projectId, itemId]);

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName, claimant: claimant || null }),
      });
      if (!res.ok) throw new Error('儲存失敗');
      setMessage('已儲存');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  async function removeItem() {
    const confirmed = window.confirm('確定要刪除此品項？此操作無法復原。');
    if (!confirmed) return;

    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
        method: 'DELETE',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || '刪除失敗');
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '刪除失敗');
    } finally {
      setSaving(false);
    }
  }

  async function addRecommendation(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    setRecSaving(true);
    setRecMessage('');
    try {
      const nextInteractiveData = {
        ...item.interactiveData,
        recommendations: [
          ...item.interactiveData.recommendations,
          {
            id: `rec_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
            type: 'recommendation' as const,
            author: recAuthor,
            title: recTitle,
            url: recUrl,
            note: recNote || undefined,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactiveData: nextInteractiveData }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || '新增推薦失敗');

      setItem((prev) => (prev ? { ...prev, interactiveData: nextInteractiveData } : prev));
      setRecAuthor('');
      setRecTitle('');
      setRecUrl('');
      setRecNote('');
      setRecMessage('推薦連結已新增');
    } catch (err) {
      setRecMessage(err instanceof Error ? err.message : '新增推薦失敗');
    } finally {
      setRecSaving(false);
    }
  }

  if (!item) return <div className="py-12 text-center text-gray-500">載入中...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/projects/${projectId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回專案
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">編輯品項</h2>

        <div className="text-sm text-gray-500">
          類別：{item.category} ・ 需求數量：{item.requiredQty} ・
          預算：NT$ {item.budgetUnitPrice.toLocaleString()}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">品項名稱</label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">認領人</label>
          <input
            value={claimant}
            onChange={(e) => setClaimant(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="留空代表未認領"
          />
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={removeItem}
            disabled={saving}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            刪除
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-semibold">管理員推薦連結</h3>
        <form onSubmit={addRecommendation} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">推薦人 *</label>
              <input
                required
                value={recAuthor}
                onChange={(e) => setRecAuthor(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">品名/描述 *</label>
              <input
                required
                value={recTitle}
                onChange={(e) => setRecTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">連結網址 *</label>
            <input
              required
              type="url"
              value={recUrl}
              onChange={(e) => setRecUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">備註（選填）</label>
            <input
              value={recNote}
              onChange={(e) => setRecNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {recMessage && (
            <p className={`text-sm rounded-lg px-4 py-2 ${recMessage.includes('失敗') ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50'}`}>
              {recMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={recSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {recSaving ? '新增中...' : '新增推薦'}
          </button>
        </form>

        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium text-gray-700">目前推薦</h4>
          {item.interactiveData.recommendations.length === 0 ? (
            <p className="text-sm text-gray-500">目前尚無推薦資料。</p>
          ) : (
            item.interactiveData.recommendations.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-sm">{entry.title}</p>
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-blue-600 underline break-all"
                >
                  {entry.url}
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  推薦人：{entry.author}
                </p>
                {entry.imageUrl && (
                  <a
                    href={entry.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-blue-600 underline"
                  >
                    查看示意圖
                  </a>
                )}
                {entry.note && <p className="text-sm text-gray-600 mt-1">{entry.note}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Interactive data (read-only overview) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold mb-3">互動資料概覽</h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">留言</dt>
            <dd className="font-medium">{item.interactiveData.comments.length} 則</dd>
          </div>
          <div>
            <dt className="text-gray-500">認領記錄</dt>
            <dd className="font-medium">{item.interactiveData.claims.length} 筆</dd>
          </div>
          <div>
            <dt className="text-gray-500">推薦連結</dt>
            <dd className="font-medium">{item.interactiveData.recommendations.length} 個</dd>
          </div>
          <div>
            <dt className="text-gray-500">收據</dt>
            <dd className="font-medium">{item.interactiveData.receipts.length} 張</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
