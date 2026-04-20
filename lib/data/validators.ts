import { z } from 'zod';
import { appConfig } from '@/config/app.config';

export const addCommentSchema = z.object({
  author: z.string().trim().min(1, '請輸入名稱').max(50),
  content: z.string().min(1, '請輸入內容').max(appConfig.maxCommentLength),
});

export const addRecommendationSchema = z.object({
  author: z.string().trim().min(1, '請輸入名稱').max(50),
  title: z.string().min(1).max(100),
  url: z.string().url('網址格式錯誤'),
  note: z.string().max(300).optional().or(z.literal('')),
});

export const addClaimSchema = z.object({
  author: z.string().trim().min(1, '請輸入名稱').max(50),
  note: z.string().max(300).optional().or(z.literal('')),
});

export const uploadBase64Schema = z.object({
  author: z.string().trim().min(1, '請輸入名稱').max(50),
  base64: z.string().min(10),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  note: z.string().max(300).optional().or(z.literal('')),
});
