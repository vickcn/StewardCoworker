import type { HTMLAttributes } from 'react';
export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm ${props.className ?? ''}`} {...props} />;
}
