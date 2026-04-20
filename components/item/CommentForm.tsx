'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export function CommentForm({ itemId }: { itemId: string }) {
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADD_COMMENT', itemId, payload: { author, content } }),
    });
    setAuthor(''); setContent('');
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-semibold">留言板</h2>
      <div className="mt-4 grid gap-3">
        <Input required placeholder="您的稱呼" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Textarea required rows={4} placeholder="留言內容" value={content} onChange={(e) => setContent(e.target.value)} />
        <Button type="submit">送出留言</Button>
      </div>
    </form>
  );
}
