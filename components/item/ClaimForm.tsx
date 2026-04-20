'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export function ClaimForm({ itemId }: { itemId: string }) {
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADD_CLAIM', itemId, payload: { author, note } }),
    });
    setAuthor(''); setNote('');
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-semibold">認領此項目</h2>
      <div className="mt-4 grid gap-3">
        <Input required placeholder="您的稱呼" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Textarea placeholder="備註（可選）" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit">送出認領</Button>
      </div>
    </form>
  );
}
