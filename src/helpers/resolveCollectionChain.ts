import type { EVM } from '@/providers/nft-scan/types.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

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
