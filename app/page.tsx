'use client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { ItemGrid } from '@/components/dashboard/ItemGrid';
import { ItemTable } from '@/components/dashboard/ItemTable';
import { useItems } from '@/hooks/useItems';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useAppContext } from '@/hooks/useAppContext';

export default function HomePage() {
  const { items, loading, error } = useItems();
  const { keyword, setKeyword, category, setCategory, sortBy, setSortBy, filteredItems, stats } = useDashboardFilters(items);
  const { viewMode } = useAppContext();

  return (
    <main className="space-y-6">
      <DashboardHeader />
      <DashboardStats {...stats} />
      <FilterBar keyword={keyword} onKeywordChange={setKeyword} category={category} onCategoryChange={setCategory} sortBy={sortBy} onSortChange={setSortBy} />
      {loading ? <div>載入中...</div> : error ? <div className="text-red-600">{error}</div> : viewMode === 'grid' ? <ItemGrid items={filteredItems} /> : <ItemTable items={filteredItems} />}
    </main>
  );
}
