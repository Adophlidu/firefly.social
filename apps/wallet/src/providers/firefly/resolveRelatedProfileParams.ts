import { fireflyWorkerEndpoint } from '@/providers/firefly/worker.js';
import type { PlatformIdentityKey } from '@/providers/types/Firefly.js';

export async function resolveRelatedProfileParams(options?: Partial<Record<PlatformIdentityKey, string>>) {
    if (options?.bskyHandle) {
        const did = await fireflyWorkerEndpoint.convertBskyHandleToDid(options.bskyHandle);
        if (did) return { ...options, bskyDid: did };
    }
    return options ? { ...options } : {};
}
