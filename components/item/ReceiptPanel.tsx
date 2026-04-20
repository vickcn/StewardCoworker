import { Card } from '@/components/ui/Card';
export function ReceiptPanel({ receiptLink, images }: { receiptLink: string | null; images: string[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">收據與參考圖片</h2>
      <div className="mt-4 space-y-3">
        {receiptLink ? <a href={receiptLink} target="_blank" rel="noreferrer" className="text-amber-700 underline">查看收據</a> : <p className="text-stone-500">尚未上傳收據。</p>}
        {images.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer" className="block underline">{src}</a>)}
      </div>
    </Card>
  );
}
