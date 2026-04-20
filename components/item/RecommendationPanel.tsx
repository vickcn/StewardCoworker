import { Card } from '@/components/ui/Card';
import type { RecommendationEntry } from '@/types/comment';

export function RecommendationPanel({ recommendations }: { recommendations: RecommendationEntry[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">推薦連結</h2>
      <div className="mt-4 space-y-3">
        {recommendations.length === 0 ? <p className="text-stone-500">目前尚無推薦資料。</p> : recommendations.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-stone-200 p-4">
            <div className="font-medium">{entry.title}</div>
            <a className="mt-1 block text-amber-700 underline" href={entry.url} target="_blank" rel="noreferrer">{entry.url}</a>
            {entry.note ? <p className="mt-2 text-sm text-stone-600">{entry.note}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
