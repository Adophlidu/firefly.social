import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import { BSKY_SOCIAL_ROOT_URL } from '@/bsky-identity/src/constants.js';
import { fetchBskyApi } from '@/bsky-identity/src/fetchBskyApi.js';

export async function resolveIdentity(did: string, c: Context): Promise<string | null> {
    try {
        const response = await fetchBskyApi<{ handle: string }>(
            urlcat(BSKY_SOCIAL_ROOT_URL, '/xrpc/com.atproto.identity.resolveIdentity', {
                did: encodeURIComponent(did),
            }),
            {
                context: c,
            },
        );
        return response.handle;
    } catch (error) {
        console.error(`[resolveIdentity] Error resolving identity: ${did}`, error);
        throw error;
    }
}
