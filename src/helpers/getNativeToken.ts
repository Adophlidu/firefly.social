import { unreachable } from '@masknet/kit';
import { ChainId as EVMChainId } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana';

import { NetworkType } from '@/constants/enum.js';
import { EVMChainResolver, SolanaChainResolver } from '@/mask/index.js';

export function getNativeToken(networkType: NetworkType, chainId?: number) {
    switch (networkType) {
        case NetworkType.Solana:
            return SolanaChainResolver.nativeCurrency(SolanaChainId.Mainnet);
        case NetworkType.Ethereum:
            return EVMChainResolver.nativeCurrency(chainId ?? EVMChainId.Mainnet);
        default:
            unreachable(networkType);
    }
}
