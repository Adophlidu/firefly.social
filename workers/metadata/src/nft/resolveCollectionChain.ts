import { EthereumChainId } from '@dimensiondev/workers-shared/types/ethereum.js';

import type { Collection } from '@/metadata/src/nft/types.js';

export function resolveCollectionChain(collection: Collection): {
    address: string;
    chainId: number;
} {
    const address = collection.contract_address;

    return {
        address,
        chainId: collection.chain_id || EthereumChainId.Mainnet,
    };
}
