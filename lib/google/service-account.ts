import { google } from 'googleapis';
import { env } from '@/lib/utils/env';

const GOOGLE_API_SCOPES: string[] = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

export function getGoogleServiceAccountAuth() {
  return new google.auth.JWT({
    email: env.googleServiceAccountEmail(),
    key: env.googlePrivateKey(),
    scopes: GOOGLE_API_SCOPES,
  });
}
