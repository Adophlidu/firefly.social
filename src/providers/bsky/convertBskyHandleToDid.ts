import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type ResponseJson } from '@/types/utility.js';

async function convertBskyHandleToDidViaFireflyWorker(handle: string) {
    const response = await fetchJson<
        ResponseJson<{
            did: string;
        }>
    >(
        urlcat(FIREFLY_WORKER_HOST, '/bsky-identity/resolve-handle', {
            handle,
        }),
    );
    if (response.success && response.data.did) return response.data.did;
    return null;
}

async function convertBskyHandleToDidViaAtProtocol(handle: string) {
    const response = await bskySessionHolder.agent.com.atproto.identity.resolveHandle({ handle });
    if (response.success && response.data.did) return response.data.did;
    return null;
}

export async function convertBskyHandleToDid(handle: string) {
    if (handle.endsWith('.bsky.social')) {
        return convertBskyHandleToDidViaFireflyWorker(handle);
    }
    return convertBskyHandleToDidViaAtProtocol(handle);
}
