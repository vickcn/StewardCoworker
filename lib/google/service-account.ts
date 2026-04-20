import { google } from 'googleapis';
import { getRequiredEnv } from '@/lib/utils/env';

export function getGoogleServiceAccountAuth() {
  const email = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const key = getRequiredEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email,
    key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}
