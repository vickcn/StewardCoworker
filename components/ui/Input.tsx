import type { InputHTMLAttributes } from 'react';
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-amber-500" {...props} />;
}
