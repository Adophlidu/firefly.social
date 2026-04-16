import { mainnet } from 'viem/chains';

import type { EVM } from '@/providers/nftscan/types.js';

export function resolveCollectionChain(collection: EVM.Collection): {
    address: string;
    chainId: number;
} {
    const address = collection.contract_address;

    return {
        address,
        chainId: collection.chain_id || mainnet.id,
    };
}
