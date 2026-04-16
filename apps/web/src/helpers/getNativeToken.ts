import { unreachable } from '@dimensiondev/utils';
import { mainnet } from 'viem/chains';

import { NetworkType } from '@/constants/enum.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { SolanaChainResolver } from '@/web3-providers/solana/ResolverAPI.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function getNativeToken(networkType: NetworkType, chainId?: number) {
    switch (networkType) {
        case NetworkType.Solana:
            return SolanaChainResolver.nativeCurrency(SolanaChainId.Mainnet);
        case NetworkType.Ethereum:
            return EVMChainResolver.nativeCurrency(chainId ?? mainnet.id);
        default:
            unreachable(networkType);
    }
}
