import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { type CollectionStatisticsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getCollectionStatistics(chainId: number, contractAddress: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/statistics', {
        chainId,
        contractAddress,
    });
    const response = await fetchJson<CollectionStatisticsResponse>(url);
    return response.data;
}
