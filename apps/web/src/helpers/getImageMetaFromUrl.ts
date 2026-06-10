import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import type { ImageDigested } from '@dimensiondev/workers-sizeof';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { ResponseJson } from '@/types/utility.js';

export async function getImageMetaFromUrl(url: string): Promise<ImageDigested | null> {
    const response = await fetchJson<ResponseJson<ImageDigested>>(
        urlcat(FIREFLY_WORKER_HOST, '/sizeof', {
            link: url,
        }),
    );
    if (!response.success) return null;
    return response.data;
}
