import { Card } from '@/components/ui/Card';
import type { CommentEntry } from '@/types/comment';
export function CommentList({ comments }: { comments: CommentEntry[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">最新留言</h2>
      <div className="mt-4 space-y-3">
        {comments.length === 0 ? <p className="text-stone-500">目前還沒有留言。</p> : comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-stone-200 p-4">
            <div className="font-medium">{comment.author}</div>
            <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
            <div className="mt-2 text-xs text-stone-400">{comment.createdAt}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
