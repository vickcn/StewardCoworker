import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { updateItemInteractiveData, uploadProjectFile } from '@/lib/google/project-integration';
import {
  addCommentSchema,
  addClaimSchema,
  addRecommendationSchema,
  uploadBase64Schema,
} from '@/lib/data/validators';
import { randomId } from '@/lib/utils/string';
import { nowIso as isoNow } from '@/lib/utils/datetime';
import { SHEET_COLUMNS } from '@/lib/constants/sheet';
import { updateItemField } from '@/lib/google/project-integration';
import { z } from 'zod';

const baseActionSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(['ADD_COMMENT', 'ADD_CLAIM', 'ADD_RECOMMENDATION', 'UPLOAD_RECEIPT', 'UPLOAD_IMAGE']),
});

async function resolveShare(shareToken: string) {
  const share = await db.projectPublicShare.findUnique({
    where: { shareToken },
    include: { project: true },
  });
  if (!share || !share.isEnabled) return null;
  return share;
}

// POST /api/public/[shareToken]/actions
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const share = await resolveShare(shareToken);
  if (!share) return fail('Not found or sharing disabled', 404);

  const body = await req.json();
  const base = baseActionSchema.safeParse(body);
  if (!base.success) return fail('Invalid input', 400, base.error.flatten());

  const { itemId, type } = base.data;
  const projectId = share.projectId;

  try {
    switch (type) {
      case 'ADD_COMMENT': {
        if (!share.allowComment) return fail('Comments are disabled', 403);
        const parsed = addCommentSchema.safeParse(body);
        if (!parsed.success) return fail('Invalid comment data', 400, parsed.error.flatten());
        const { author, content } = parsed.data;
        await updateItemInteractiveData(projectId, itemId, (item) => ({
          ...item.interactiveData,
          comments: [
            ...item.interactiveData.comments,
            { id: randomId('comment'), type: 'comment', author, content, createdAt: isoNow() },
          ],
        }));
        return ok({ added: 'comment' });
      }

      case 'ADD_CLAIM': {
        if (!share.allowClaim) return fail('Claims are disabled', 403);
        const parsed = addClaimSchema.safeParse(body);
        if (!parsed.success) return fail('Invalid claim data', 400, parsed.error.flatten());
        const { author, note } = parsed.data;
        await updateItemInteractiveData(projectId, itemId, (item) => ({
          ...item.interactiveData,
          claims: [
            ...item.interactiveData.claims,
            { id: randomId('claim'), type: 'claim', author, note, createdAt: isoNow() },
          ],
        }));
        await updateItemField(projectId, itemId, SHEET_COLUMNS.CLAIMANT, author);
        return ok({ added: 'claim' });
      }

      case 'ADD_RECOMMENDATION': {
        if (!share.allowRecommendation) return fail('Recommendations are disabled', 403);
        const parsed = addRecommendationSchema.safeParse(body);
        if (!parsed.success) return fail('Invalid recommendation data', 400, parsed.error.flatten());
        const { author, title, url, note } = parsed.data;
        await updateItemInteractiveData(projectId, itemId, (item) => ({
          ...item.interactiveData,
          recommendations: [
            ...item.interactiveData.recommendations,
            { id: randomId('rec'), type: 'recommendation', author, title, url, note, createdAt: isoNow() },
          ],
        }));
        return ok({ added: 'recommendation' });
      }

      case 'UPLOAD_RECEIPT':
      case 'UPLOAD_IMAGE': {
        if (!share.allowReceiptUpload) return fail('File uploads are disabled', 403);
        const parsed = uploadBase64Schema.safeParse(body);
        if (!parsed.success) return fail('Invalid upload data', 400, parsed.error.flatten());
        const { author, base64, fileName, mimeType, note } = parsed.data;
        const buffer = Buffer.from(base64, 'base64');
        const { webViewLink } = await uploadProjectFile(projectId, { fileName, mimeType, buffer });

        await updateItemInteractiveData(projectId, itemId, (item) => {
          const entry = {
            id: randomId(type === 'UPLOAD_RECEIPT' ? 'receipt' : 'img'),
            type: type === 'UPLOAD_RECEIPT' ? ('receipt' as const) : ('receipt' as const),
            author,
            fileUrl: webViewLink ?? '',
            fileName,
            note,
            createdAt: isoNow(),
          };
          return {
            ...item.interactiveData,
            receipts: [...item.interactiveData.receipts, entry],
          };
        });
        return ok({ added: type === 'UPLOAD_RECEIPT' ? 'receipt' : 'image', url: webViewLink });
      }

      default:
        return fail('Unknown action type', 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Action failed';
    return fail(message, 500);
  }
}
