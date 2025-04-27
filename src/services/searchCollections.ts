import { EMPTY_LIST } from '@/constants/index.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { trimify } from '@/helpers/trimify.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

const SEARCH_CHAIN_ID_LIST = [
    EthereumChainId.Mainnet,
    EthereumChainId.BSC,
    EthereumChainId.Base,
    EthereumChainId.Polygon,
    EthereumChainId.Optimism,
    EthereumChainId.Arbitrum,
    EthereumChainId.Zora,
];

const searchCollectionByAddress = memoizePromise(
    function searchCollectionByAddress(address: string) {
        const controller = new AbortController();
        return Promise.any(
            SEARCH_CHAIN_ID_LIST.map(async (chainId) => {
                const result = await FireflyEndpointProvider.getCollection(chainId, address);
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

    if (isValidAddressEthereum(formatted)) {
        const collection = await runInSafeAsync(() => searchCollectionByAddress(formatted));
        return createPageable(collection ? [collection] : EMPTY_LIST, createIndicator());
    } else {
        return FireflyEndpointProvider.searchCollections(keyword);
    }
}
