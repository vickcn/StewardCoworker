import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '@/lib/utils/env';

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: env.databaseUrl() });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const db = globalThis.__prisma ?? createPrismaClient();

if (env.isDev()) {
  globalThis.__prisma = db;
}
