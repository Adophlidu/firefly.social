import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { ResponseJson } from '@/types/utility.js';

async function convertBskyHandleToDidViaFireflyWorker(handle: string, signal?: AbortSignal) {
    const response = await fetchJson<
        ResponseJson<{
            did: string;
        }>
    >(
        urlcat(FIREFLY_WORKER_HOST, '/bsky-identity/resolve-handle', {
            handle,
        }),
        {
            signal,
        },
    );
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
