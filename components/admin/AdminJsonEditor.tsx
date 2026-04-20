'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

export function AdminJsonEditor({ itemId, initialJson }: { itemId: string; initialJson: string }) {
  const [value, setValue] = useState(initialJson);
  async function save() {
    await fetch('/api/admin/update-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, interactiveJson: value }),
    });
  }
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-semibold">互動資料 JSON</h2>
      <Textarea rows={18} className="mt-4 font-mono text-sm" value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="mt-3"><Button type="button" onClick={save}>更新 JSON</Button></div>
    </div>
  );
}
