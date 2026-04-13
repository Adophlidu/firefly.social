import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createPageable, runInSafeAsync } from '@dimensiondev/utils';

import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { trimify } from '@/helpers/trimify.js';
import { detectCollection } from '@/providers/firefly/nft/detectCollection.js';
import { searchCollectionsByKeyword } from '@/providers/firefly/nft/searchCollectionsByKeyword.js';
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

export async function searchCollections(keywordOrAddress: string) {
    const formatted = trimify(keywordOrAddress).toLowerCase();
    if (!isValidAddressEthereum(formatted)) return searchCollectionsByKeyword(keywordOrAddress);

    const collection = await runInSafeAsync(async () => {
        const detected = await detectCollection(formatted);
        if (detected?.chain_id && !SEARCH_CHAIN_ID_LIST.includes(detected.chain_id)) {
            return null;
        }
        return detected;
    });
    return createPageable(collection ? [collection] : EMPTY_LIST, createIndicator());
}
