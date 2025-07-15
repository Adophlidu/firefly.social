import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { ResponseJSON } from '@/types/index.js';

interface ImageDigested {
    width: number;
    height: number;
}

export async function getImageMetaFromUrl(url: string): Promise<ImageDigested | null> {
    const response = await fetchJSON<ResponseJSON<ImageDigested>>(
        urlcat(FIREFLY_WORKER_HOST, '/sizeof', {
            link: url,
        }),
    );
    if (!response.success) return null;
    return response.data;
}
