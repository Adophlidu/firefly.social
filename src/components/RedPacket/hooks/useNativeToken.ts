import { unreachable } from '@masknet/kit';
import { ChainId } from '@masknet/web3-shared-solana';

import { NetworkType } from '@/constants/enum.js';
import { EVMChainResolver, SolanaChainResolver } from '@/mask/index.js';

export function useNativeToken(chainId: number, networkType: NetworkType) {
    switch (networkType) {
        case NetworkType.Solana:
            return SolanaChainResolver.nativeCurrency(ChainId.Mainnet);
        case NetworkType.Ethereum:
            return EVMChainResolver.nativeCurrency(chainId);
        default:
            unreachable(networkType);
    }
}
