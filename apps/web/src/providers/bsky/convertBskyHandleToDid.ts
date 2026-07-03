import { bskyWorker } from '@dimensiondev/workers-client';

import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { ResponseJson } from '@/types/utility.js';

async function convertBskyHandleToDidViaFireflyWorker(handle: string, signal?: AbortSignal) {
    const res = await bskyWorker.bsky.identity['resolve-handle'].$get({ query: { handle } }, { init: { signal } });
    const response = (await res.json()) as ResponseJson<{ did: string }>;
    if (response.success && response.data.did) return response.data.did;
    return null;
}

async function convertBskyHandleToDidViaAtProtocol(handle: string, signal?: AbortSignal) {
    const response = await bskySessionHolder.agent.com.atproto.identity.resolveHandle({ handle }, { signal });
    if (response.success && response.data.did) return response.data.did;
    return null;
}

export async function convertBskyHandleToDid(handle: string, signal?: AbortSignal) {
    if (handle.endsWith('.bsky.social')) {
        return convertBskyHandleToDidViaFireflyWorker(handle, signal);
    }
    return convertBskyHandleToDidViaAtProtocol(handle, signal);
}
