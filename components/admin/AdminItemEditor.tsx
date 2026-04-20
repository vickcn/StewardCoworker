'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ItemRecord } from '@/types/item';

export function AdminItemEditor({ item }: { item: ItemRecord }) {
  const [itemName, setItemName] = useState(item.itemName);
  const [claimant, setClaimant] = useState(item.claimant || '');
  async function save() {
    await fetch('/api/admin/update-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, itemName, claimant }),
    });
  }
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-semibold">基本編輯</h2>
      <div className="mt-4 grid gap-3">
        <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
        <Input value={claimant} onChange={(e) => setClaimant(e.target.value)} />
        <Button type="button" onClick={save}>儲存</Button>
      </div>
    </div>
  );
}
