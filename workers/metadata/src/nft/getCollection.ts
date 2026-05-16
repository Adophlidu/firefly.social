import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import { NFTSCAN_CHAIN_IDS } from '@/metadata/src/nft/getNftDetail.js';
import type { Collection, CollectionResponse } from '@/metadata/src/nft/types.js';

function fixCollection(collection: Collection): Collection {
    return {
        ...collection,
        chain_id: +collection.chain_id,
    };
}

export async function getCollection(chainId: number, contractAddress: string, c: Context) {
    if (!NFTSCAN_CHAIN_IDS.includes(chainId)) return null;
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/nft/collection', {
        chainId,
        contractAddress,
    });
    const response = await fetchJson<CollectionResponse>(url, {
        context: c,
    });
    if (!response.data) return null;
    if ('chain_id' in response.data && Object.keys(response.data).length <= 1) return null;
    return fixCollection(response.data);
}
