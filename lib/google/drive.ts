import { google } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleServiceAccountAuth } from './service-account';

export async function uploadFileToDrive({
  folderId, fileName, mimeType, buffer,
}: { folderId: string; fileName: string; mimeType: string; buffer: Buffer }) {
  const drive = google.drive({ version: 'v3', auth: getGoogleServiceAccountAuth() });
  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,name,webViewLink,webContentLink',
  });
  const fileId = created.data.id;
  if (!fileId) throw new Error('Drive file id missing');
  await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' } });
  return { fileId, webViewLink: created.data.webViewLink ?? null, webContentLink: created.data.webContentLink ?? null };
}
