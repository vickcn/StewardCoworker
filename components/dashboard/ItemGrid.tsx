import { ItemCard } from '@/components/item/ItemCard';
import type { ItemRecord } from '@/types/item';
export function ItemGrid({ items }: { items: ItemRecord[] }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <ItemCard key={item.id} item={item} />)}</div>;
}
