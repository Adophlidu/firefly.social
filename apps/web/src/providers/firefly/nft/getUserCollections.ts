import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { fixCollection } from '@/providers/firefly/endpoint/fixCollection.js';
import type { CollectionsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getUserCollections(chainId: number, walletAddress: string, indicator?: PageIndicator) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/own/collection', {
        chainId,
        walletAddress,
        cursor: indicator?.id,
    });
    const response = await fetchJson<CollectionsResponse>(url);
    const collections = (response.data?.collections || []).map(fixCollection);
    return createPageable(
        collections,
        createIndicator(indicator),
        response.data?.cursor && collections.length ? createNextIndicator(indicator, response.data.cursor) : undefined,
    );
}
