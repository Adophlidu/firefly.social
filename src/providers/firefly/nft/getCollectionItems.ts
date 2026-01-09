import urlcat from 'urlcat';

import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { type CollectionItemsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getCollectionItems(chainId: number, contractAddress: string, indicator?: PageIndicator) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/items', {
        chainId,
        contractAddress,
        cursor: indicator?.id,
    });
    const response = await fetchJson<CollectionItemsResponse>(url);
    const list = (response.data?.content || []).map(adjustAssetUris);
    return createPageable(
        list,
        createIndicator(indicator),
        response.data?.next ? createNextIndicator(indicator, response.data.next) : undefined,
    );
}
