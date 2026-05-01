'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const categories = ['食材', '器材', '文具', '場佈', '其他'] as const;

export default function PlatformItemCreatePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('其他');
  const [requiredQty, setRequiredQty] = useState(1);
  const [budgetUnitPrice, setBudgetUnitPrice] = useState(0);
  const [claimant, setClaimant] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function createItem() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          category,
          requiredQty,
          budgetUnitPrice,
          claimant: claimant || null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || '新增失敗');
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '新增失敗');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/projects/${projectId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回專案
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">新增品項</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">品項名稱</label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="例：礦泉水"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">類別</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof categories)[number])}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">需求數量</label>
            <input
              type="number"
              min={0}
              value={requiredQty}
              onChange={(e) => setRequiredQty(Number(e.target.value || 0))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">預算單價</label>
            <input
              type="number"
              min={0}
              value={budgetUnitPrice}
              onChange={(e) => setBudgetUnitPrice(Number(e.target.value || 0))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">認領人（選填）</label>
          <input
            value={claimant}
            onChange={(e) => setClaimant(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {message && <p className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-2">{message}</p>}

        <div className="flex gap-3">
          <button
            onClick={createItem}
            disabled={saving || !itemName.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '新增中...' : '新增'}
          </button>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
