import { unreachable } from '@firefly/utils';

import { NetworkType } from '@/constants/enum.js';
import { EVMChainResolver } from '@/web3-providers/Web3/EVM/apis/ResolverAPI.js';
import { SolanaChainResolver } from '@/web3-providers/Web3/Solana/apis/ResolverAPI.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function getNativeToken(networkType: NetworkType, chainId?: number) {
    switch (networkType) {
        case NetworkType.Solana:
            return SolanaChainResolver.nativeCurrency(SolanaChainId.Mainnet);
        case NetworkType.Ethereum:
            return EVMChainResolver.nativeCurrency(chainId ?? EthereumChainId.Mainnet);
        default:
            unreachable(networkType);
    }
}
