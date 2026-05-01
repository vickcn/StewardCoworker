import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

function escapeDriveQueryValue(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findFolderInParent(
  auth: OAuth2Client,
  parentId: string,
  folderName: string,
) {
  const drive = google.drive({ version: 'v3', auth });
  const q = [
    `'${parentId}' in parents`,
    `mimeType='${DRIVE_FOLDER_MIME}'`,
    `name='${escapeDriveQueryValue(folderName)}'`,
    'trashed=false',
  ].join(' and ');
  const result = await drive.files.list({
    q,
    fields: 'files(id,name)',
    pageSize: 1,
  });
  return result.data.files?.[0] ?? null;
}

async function createFolderInParent(
  auth: OAuth2Client,
  parentId: string,
  folderName: string,
) {
  const drive = google.drive({ version: 'v3', auth });
  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: DRIVE_FOLDER_MIME,
      parents: [parentId],
    },
    fields: 'id,name',
  });
  const folderId = created.data.id;
  if (!folderId) throw new Error('Drive folder id missing');
  return folderId;
}

export async function ensureDriveFolderPath({
  auth,
  rootFolderId,
  pathSegments,
}: {
  auth: OAuth2Client;
  rootFolderId: string;
  pathSegments: string[];
}) {
  let parentId = rootFolderId;
  for (const rawSegment of pathSegments) {
    const segment = rawSegment.trim();
    if (!segment) continue;
    const existing = await findFolderInParent(auth, parentId, segment);
    if (existing?.id) {
      parentId = existing.id;
      continue;
    }
    parentId = await createFolderInParent(auth, parentId, segment);
  }
  return parentId;
}

export async function uploadFileToDrive({
  auth,
  folderId, fileName, mimeType, buffer,
}: {
  auth: OAuth2Client;
  folderId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const drive = google.drive({ version: 'v3', auth });
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
