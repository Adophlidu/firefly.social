import { isValidAddress } from '@masknet/web3-shared-evm';

import { EMPTY_LIST } from '@/constants/index.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { trimify } from '@/helpers/trimify.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { NFTScanProvider } from '@/providers/nft-scan/index.js';

export async function searchCollections(keyword: string) {
    const formatted = trimify(keyword).toLowerCase();

    if (isValidAddress(formatted)) {
        const collection = await NFTScanProvider.getCollectionByAddress(formatted);

        return createPageable(collection ? [collection] : EMPTY_LIST, createIndicator());
    } else {
        return FireflyEndpointProvider.searchCollections(keyword);
    }
}
