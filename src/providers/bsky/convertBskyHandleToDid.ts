import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { ResponseJson } from '@/types/utility.js';

export async function convertBskyHandleToDid(handle: string) {
    const response = await fetchJson<
        ResponseJson<{
            did: string;
        }>
    >(
        urlcat(FIREFLY_WORKER_HOST, '/bsky-identity/resolve-handle', {
            handle,
        }),
    );
    if (!response.success) return null;
    return response.data.did;
}
