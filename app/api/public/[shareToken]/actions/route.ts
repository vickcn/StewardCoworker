import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import {
  fetchProjectItemById,
  uploadProjectFileToPath,
  updateItemField,
  updateItemInteractiveData,
  uploadProjectFile,
} from '@/lib/google/project-integration';
import {
  addCommentSchema,
  addClaimSchema,
  uploadBase64Schema,
} from '@/lib/data/validators';
import { randomId } from '@/lib/utils/string';
import { nowIso as isoNow } from '@/lib/utils/datetime';
import { SHEET_COLUMNS } from '@/lib/constants/sheet';
import { z } from 'zod';

const baseActionSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(['ADD_COMMENT', 'ADD_CLAIM', 'ADD_RECOMMENDATION', 'UPLOAD_RECEIPT', 'UPLOAD_IMAGE']),
});

const addPublicRecommendationSchema = z.object({
  author: z.string().trim().min(1, '請輸入名稱').max(50),
  url: z.string().url('網址格式錯誤'),
  note: z.string().max(300).optional().or(z.literal('')),
  imageBase64: z.string().min(10).max(12_000_000).optional(),
  imageMimeType: z.string().min(1).optional(),
  imageOriginalName: z.string().min(1).optional(),
});

const RECOMMENDATION_QUEUE_ROOT = '_recommendation_queue';
const RECOMMENDATION_IMAGE_ROOT = '_recommendation_images';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg',
};

function safeFileSegment(input: string) {
  const cleaned = input
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return cleaned || 'unknown';
}

function resolveImageExtension(originalName: string, mimeType: string) {
  const lastDot = originalName.lastIndexOf('.');
  const extFromName =
    lastDot >= 0 ? originalName.slice(lastDot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
  if (extFromName && /^\.[a-z0-9]{1,8}$/.test(extFromName)) return extFromName;
  return MIME_EXTENSION_MAP[mimeType] ?? '.png';
}

function getTaipeiTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }

  const year = values.year ?? '0000';
  const month = values.month ?? '01';
  const day = values.day ?? '01';
  const hour = values.hour ?? '00';
  const minute = values.minute ?? '00';
  const second = values.second ?? '00';
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return {
    ymd: `${year}-${month}-${day}`,
    hh: hour,
    mmssfff: `${minute}${second}${ms}`,
    hhmmss: `${hour}${minute}${second}`,
  };
}

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
        const parsed = addPublicRecommendationSchema.safeParse(body);
        if (!parsed.success) return fail('Invalid recommendation data', 400, parsed.error.flatten());
        const { author, url, note, imageBase64, imageMimeType, imageOriginalName } = parsed.data;

        const hasAnyImageField = Boolean(imageBase64 || imageMimeType || imageOriginalName);
        const hasAllImageFields = Boolean(imageBase64 && imageMimeType && imageOriginalName);
        if (hasAnyImageField && !hasAllImageFields) {
          return fail('Invalid recommendation image data', 400);
        }

        let imageUrl: string | null = null;
        let imageFileName: string | null = null;
        const item = await fetchProjectItemById(projectId, itemId);
        if (!item) return fail('Item not found', 404);
        const now = new Date();
        const taipei = getTaipeiTimeParts(now);

        if (hasAllImageFields) {
          if (!imageBase64 || !imageMimeType || !imageOriginalName) {
            return fail('Invalid recommendation image data', 400);
          }

          if (!imageMimeType.startsWith('image/')) {
            return fail('Recommendation image must be an image file', 400);
          }
          const ext = resolveImageExtension(imageOriginalName, imageMimeType);
          const imageTimestamp = `${taipei.ymd.replace(/-/g, '')}_${taipei.hhmmss}`;
          imageFileName = `${safeFileSegment(item.itemName)}_${safeFileSegment(author)}_${imageTimestamp}${ext}`;

          const { webViewLink, webContentLink } = await uploadProjectFileToPath(
            projectId,
            [RECOMMENDATION_IMAGE_ROOT, item.id, taipei.ymd, taipei.hh],
            {
              fileName: imageFileName,
              mimeType: imageMimeType,
              buffer: Buffer.from(imageBase64, 'base64'),
            },
          );
          imageUrl = webViewLink ?? webContentLink ?? null;
        }
        const queueFileName = `${taipei.mmssfff}_${safeFileSegment(item.itemName)}_${safeFileSegment(author)}.json`;
        const queuePath = [RECOMMENDATION_QUEUE_ROOT, item.id, taipei.ymd, taipei.hh];
        const queuePayload = {
          kind: 'recommendation',
          status: 'pending',
          projectId,
          itemId: item.id,
          itemName: item.itemName,
          recommenderName: author,
          recommendUrl: url,
          note: note || undefined,
          imageUrl: imageUrl ?? undefined,
          imageFileName: imageFileName ?? undefined,
          submittedAt: isoNow(),
        };

        const queueJson = `${JSON.stringify(queuePayload, null, 2)}\n`;
        const { webViewLink, webContentLink } = await uploadProjectFileToPath(
          projectId,
          queuePath,
          {
            fileName: queueFileName,
            mimeType: 'application/json',
            buffer: Buffer.from(queueJson, 'utf8'),
          },
        );

        return ok({
          queued: true,
          queueFileName,
          queueFileUrl: webViewLink ?? webContentLink ?? null,
        });
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
