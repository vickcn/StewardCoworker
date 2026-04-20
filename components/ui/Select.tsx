import type { SelectHTMLAttributes } from 'react';
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-amber-500" {...props} />;
}
