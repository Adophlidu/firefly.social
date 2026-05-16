import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { EVM } from '@dimensiondev/workers-shared/types/nftscan.js';
import type { Context } from 'hono';

import type { CollectionResponse } from '@/metadata/src/nft/types.js';

function fixCollection(collection: EVM.Collection): EVM.Collection {
    return {
        ...collection,
        chain_id: +collection.chain_id,
    };
}

export async function detectCollection(address: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/nft/detect', {
        address,
    });
    const response = await fetchJson<CollectionResponse>(url, {
        context: c,
    });
    if (!response.data) return null;
    return fixCollection(response.data);
}
