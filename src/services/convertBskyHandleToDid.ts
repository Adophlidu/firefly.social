import { resolveBskyResponseData } from '@/helpers/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function convertBskyHandleToDid(handle: string) {
    const response = await bskySessionHolder.agent.resolveHandle({
        handle,
    });
    const data = resolveBskyResponseData(response, `Failed to resolve handle: ${handle}`);
    if (!data.did) throw new Error(`Failed to resolve handle: ${handle}`);
    return data.did;
}
