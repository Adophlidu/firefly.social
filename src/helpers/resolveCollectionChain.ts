import type { EVM } from '@/providers/nft-scan/types.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function resolveCollectionChain(collection: EVM.Collection): {
    address: string;
    chainId: number;
} {
    const address = collection.contract_address;

    return {
        address,
        chainId: collection.chain_id || EthereumChainId.Mainnet,
    };
}
