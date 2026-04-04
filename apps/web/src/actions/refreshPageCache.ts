'use server';

import { revalidatePath } from 'next/cache.js';

export async function refreshPageCache(path: string, type: 'page' | 'layout') {
    revalidatePath(path, type);
}
