import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { itemCategories } from '@/lib/constants/categories';
import type { SortKey } from '@/lib/data/filters';

interface Props {
  keyword: string;
  onKeywordChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: SortKey;
  onSortChange: (value: SortKey) => void;
}

export function FilterBar(props: Props) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 md:grid-cols-3">
      <Input placeholder="搜尋品項名稱" value={props.keyword} onChange={(e) => props.onKeywordChange(e.target.value)} />
      <Select value={props.category} onChange={(e) => props.onCategoryChange(e.target.value)}>
        {itemCategories.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
      <Select value={props.sortBy} onChange={(e) => props.onSortChange(e.target.value as SortKey)}>
        <option value="default">預設排序</option>
        <option value="budget">依預算排序</option>
        <option value="variance">依差額排序</option>
      </Select>
    </div>
  );
}
