import type { TextareaHTMLAttributes } from 'react';
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-amber-500" {...props} />;
}
