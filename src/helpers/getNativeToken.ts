import { unreachable } from '@masknet/kit';
import { EthereumChainId } from '@masknet/web3-shared-evm';
import { SolanaChainId } from '@masknet/web3-shared-solana';

import { NetworkType } from '@/constants/enum.js';
import { EVMChainResolver, SolanaChainResolver } from '@/mask/index.js';

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
