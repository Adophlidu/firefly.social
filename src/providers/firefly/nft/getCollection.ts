import urlcat from 'urlcat';

import { NftScanError } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fixCollection } from '@/providers/firefly/endpoint/fixCollection.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nftscan/constants.js';
import { type CollectionResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getCollection(chainId: number, contractAddress: string) {
    if (!NFTSCAN_CHAIN_IDS.includes(chainId)) return null;

    try {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection', {
            chainId,
            contractAddress,
        });
        const response = await fetchJson<CollectionResponse>(url);

        // no collection found
        const collection = resolveFireflyResponseData(response);
        if (!collection) return null;

        // invalid response
        if ('chain_id' in collection && Object.keys(collection).length <= 1) return null;

        return fixCollection(collection);
    } catch (error) {
        if (error instanceof NftScanError) return null;
        throw error;
    }
}
