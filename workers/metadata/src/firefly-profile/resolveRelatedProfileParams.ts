import { resolveHandle } from '@dimensiondev/workers-bsky/identity/resolveHandle.js';
import type { Context } from 'hono';

import type { PlatformIdentityKey } from '@/metadata/src/firefly-profile/types.js';

export async function resolveRelatedProfileParams(options: Partial<Record<PlatformIdentityKey, string>>, c: Context) {
    if (options?.bskyHandle) {
        const did = await resolveHandle(options.bskyHandle, c);
        if (did) options.bskyDid = did;
    }
    return options || {};
}
