import { EMPTY_LIST } from '@/constants/static.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { trimify } from '@/helpers/trimify.js';
import { searchCollections as searchCollectionsEndpoint } from '@/providers/firefly/endpoint/searchCollections.js';
import { detectCollection } from '@/providers/firefly/nft/detectCollection.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

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
    async function searchCollectionByAddress(address: string) {
        const detected = await detectCollection(address);
        if (detected?.chain_id && !SEARCH_CHAIN_ID_LIST.includes(detected.chain_id)) {
            return null;
        }
        return detected;
    },
    (address) => `nftscan-collection-${address}`,
);

export async function searchCollections(keyword: string) {
    const formatted = trimify(keyword).toLowerCase();

    if (isValidAddressEthereum(formatted)) {
        const collection = await runInSafeAsync(() => searchCollectionByAddress(formatted));
        return createPageable(collection ? [collection] : EMPTY_LIST, createIndicator());
    } else {
        return searchCollectionsEndpoint(keyword);
    }
}
