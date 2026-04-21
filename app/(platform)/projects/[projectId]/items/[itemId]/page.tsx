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
