import { NextRequest } from 'next/server';
import { getRequiredEnv } from '@/lib/utils/env';
import { uploadFileToDrive } from '@/lib/google/drive';
import { fail, ok } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return fail('缺少檔案', 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFileToDrive({
      folderId: getRequiredEnv('GOOGLE_DRIVE_FOLDER_ID'),
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      buffer,
    });
    return ok({ success: true, uploaded });
  } catch (error) {
    return fail('上傳失敗', 500, error instanceof Error ? error.message : undefined);
  }
}
