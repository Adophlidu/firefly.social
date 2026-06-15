import { sizeofWorker } from '@dimensiondev/workers-client';
import type { ImageDigested } from '@dimensiondev/workers-sizeof';

import type { ResponseJson } from '@/types/utility.js';

export async function getImageMetaFromUrl(url: string): Promise<ImageDigested | null> {
    const res = await sizeofWorker.sizeof.$get({ query: { link: url } });
    const response = (await res.json()) as ResponseJson<ImageDigested>;
    if (!response.success) return null;
    return response.data;
}
