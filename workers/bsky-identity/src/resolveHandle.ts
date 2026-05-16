import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import { BSKY_SOCIAL_ROOT_URL } from '@/bsky-identity/src/constants.js';
import { fetchBskyApi } from '@/bsky-identity/src/fetchBskyApi.js';

export async function resolveHandle(handle: string, c: Context): Promise<string | null> {
    try {
        const response = await fetchBskyApi<{ did: string }>(
            urlcat(BSKY_SOCIAL_ROOT_URL, '/xrpc/com.atproto.identity.resolveHandle', {
                handle: encodeURIComponent(handle),
            }),
            {
                context: c,
            },
        );
        return response.did;
    } catch (error) {
        console.error(`[resolveHandle] Error resolving handle: ${handle}`, error);
        throw error;
    }
}
