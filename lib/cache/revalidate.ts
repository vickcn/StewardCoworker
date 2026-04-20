import { revalidatePath } from 'next/cache';
export function revalidateItemPaths(itemId?: string) {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/items');
  if (itemId) {
    revalidatePath(`/items/${itemId}`);
    revalidatePath(`/admin/items/${itemId}`);
  }
}
