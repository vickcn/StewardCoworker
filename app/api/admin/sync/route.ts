import { revalidateItemPaths } from '@/lib/cache/revalidate';
import { ok } from '@/lib/utils/response';
export async function POST() { revalidateItemPaths(); return ok({ success: true }); }
