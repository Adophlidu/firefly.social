import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { fixCollection } from '@/providers/firefly/endpoint/fixCollection.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import type { CollectionResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getCollection(chainId: number, contractAddress: string) {
    if (!NFTSCAN_CHAIN_IDS.includes(chainId)) return null;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection', {
        chainId,
        contractAddress,
    });
    const response = await fetchJson<CollectionResponse>(url);
    if (!response.data) return null;
    if ('chain_id' in response.data && Object.keys(response.data).length <= 1) return null;
    return fixCollection(response.data);
}
