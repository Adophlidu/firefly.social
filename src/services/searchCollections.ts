import { ChainId, isValidAddress } from '@masknet/web3-shared-evm';

import { EMPTY_LIST } from '@/constants/index.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { trimify } from '@/helpers/trimify.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { NFTScanProvider } from '@/providers/nft-scan/index.js';

const SEARCH_CHAIN_ID_LIST = [
    ChainId.Mainnet,
    ChainId.BSC,
    ChainId.Base,
    ChainId.Polygon,
    ChainId.Optimism,
    ChainId.Arbitrum,
    ChainId.Linea,
    ChainId.Zora,
];

const searchCollectionByAddress = memoizePromise(
    function searchCollectionByAddress(address: string) {
        const controller = new AbortController();
        return Promise.any(
            SEARCH_CHAIN_ID_LIST.map(async (chainId) => {
                const result = await NFTScanProvider.getCollectionByAddress(address, chainId, controller.signal);
                if (result) {
                    controller.abort();
                    return result;
                }

                throw new Error(`Invalid collection on ${chainId}`);
            }),
        );
    },
    (address) => `nftscan-collection-${address}`,
);

export async function searchCollections(keyword: string) {
    const formatted = trimify(keyword).toLowerCase();

    if (isValidAddress(formatted)) {
        const collection = await runInSafeAsync(() => searchCollectionByAddress(formatted));

        return createPageable(collection ? [collection] : EMPTY_LIST, createIndicator());
    } else {
        return FireflyEndpointProvider.searchCollections(keyword);
    }
}
