'use client';
import { useAppContext } from '@/hooks/useAppContext';
import { Button } from '@/components/ui/Button';

export function DashboardHeader() {
  const { isLarge, setIsLarge, viewMode, setViewMode } = useAppContext();
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-white p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">春時慢卷總務協作平台</h1>
        <p className="mt-2 text-stone-600">公開查看、認領、留言與採購協作。</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => setIsLarge(!isLarge)}>{isLarge ? '切到標準字' : '切到大字體'}</Button>
        <Button type="button" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? '' : 'opacity-70'}>卡片</Button>
        <Button type="button" onClick={() => setViewMode('table')} className={viewMode === 'table' ? '' : 'opacity-70'}>表格</Button>
      </div>
    </div>
  );
}
