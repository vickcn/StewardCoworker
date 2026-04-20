import { notFound } from 'next/navigation';
import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows } from '@/lib/google/sheets';
import { mapRowToItem } from '@/lib/data/item-mapper';
import { ItemDetailHero } from '@/components/item/ItemDetailHero';
import { ItemBudgetPanel } from '@/components/item/ItemBudgetPanel';
import { RecommendationPanel } from '@/components/item/RecommendationPanel';
import { ReceiptPanel } from '@/components/item/ReceiptPanel';
import { ClaimForm } from '@/components/item/ClaimForm';
import { CommentForm } from '@/components/item/CommentForm';
import { CommentList } from '@/components/item/CommentList';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await readAllRows(getRequiredEnv('SPREADSHEET_ID'));
  if (!rows.length) return notFound();
  const [headers, ...dataRows] = rows;
  const row = dataRows.find((r) => r[headers.indexOf('ID')] === id);
  if (!row) return notFound();
  const item = mapRowToItem(headers, row);

  return (
    <main className="space-y-6">
      <ItemDetailHero item={item} />
      <ItemBudgetPanel item={item} />
      <RecommendationPanel recommendations={item.interactiveData.recommendations} />
      <ReceiptPanel receiptLink={item.receiptLink} images={item.interactiveData.images} />
      <ClaimForm itemId={item.id} />
      <CommentForm itemId={item.id} />
      <CommentList comments={item.interactiveData.comments} />
    </main>
  );
}
