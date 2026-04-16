import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createPageable, runInSafeAsync } from '@dimensiondev/utils';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { arbitrum, base, bsc, mainnet, optimism, polygon, zora } from 'viem/chains';

import { trimify } from '@/helpers/trimify.js';
import { detectCollection } from '@/providers/firefly/nft/detectCollection.js';
import { searchCollectionsByKeyword } from '@/providers/firefly/nft/searchCollectionsByKeyword.js';

const SEARCH_CHAIN_ID_LIST = [mainnet.id, bsc.id, base.id, polygon.id, optimism.id, arbitrum.id, zora.id];

export async function searchCollections(keywordOrAddress: string) {
    const formatted = trimify(keywordOrAddress).toLowerCase();
    if (!isValidAddressEthereum(formatted)) return searchCollectionsByKeyword(keywordOrAddress);

    const collection = await runInSafeAsync(async () => {
        const detected = await detectCollection(formatted);
        if (detected?.chain_id && !SEARCH_CHAIN_ID_LIST.some((id) => id === detected.chain_id)) {
            return null;
        }
        return detected;
    });
    return createPageable(collection ? [collection] : EMPTY_LIST, createIndicator());
}
