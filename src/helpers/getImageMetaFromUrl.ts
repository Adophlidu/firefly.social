import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { ResponseJson } from '@/types/utility.js';

interface ImageDigested {
    width: number;
    height: number;
}

export async function getImageMetaFromUrl(url: string): Promise<ImageDigested | null> {
    const response = await fetchJson<ResponseJson<ImageDigested>>(
        urlcat(FIREFLY_WORKER_HOST, '/sizeof', {
            link: url,
        }),
    );
    if (!response.success) return null;
    return response.data;
}
