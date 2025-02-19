import { KeyType } from '@/constants/enum.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveBskyResponseData } from '@/helpers/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

async function convertHandleToDid(handle: string) {
    const response = await bskySessionHolder.agent.resolveHandle({
        handle,
    });
    const data = resolveBskyResponseData(response, `Failed to resolve handle: ${handle}`);
    if (!data.did) throw new Error(`Failed to resolve handle: ${handle}`);
    return data.did;
}

export const convertBskyHandleToDid = memoizeWithRedis(convertHandleToDid, {
    key: KeyType.ConvertBskyHandleToDid,
}) as typeof convertHandleToDid;
