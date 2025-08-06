import { convertBskyHandleToDid } from '@/providers/bsky/convertBskyHandleToDid.js';
import { type PlatformIdentityKey } from '@/providers/types/Firefly.js';

export async function resolveRelatedProfileParams(options?: Partial<Record<PlatformIdentityKey, string>>) {
    if (options?.bskyHandle) {
        const did = await convertBskyHandleToDid(options.bskyHandle);
        if (did) options.bskyDid = did;
    }
    return options || {};
}
