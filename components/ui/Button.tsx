import type { ButtonHTMLAttributes } from 'react';
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="rounded-xl border border-amber-200 bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600 disabled:opacity-50" {...props} />;
}
