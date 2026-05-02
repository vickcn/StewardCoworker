import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/lib/utils/env';

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl() });
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
