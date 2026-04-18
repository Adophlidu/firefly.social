import { unreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { mainnet } from 'viem/chains';

import { NetworkType } from '@/constants/enum.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { SolanaChainResolver } from '@/web3-providers/solana/ResolverAPI.js';

export function getNativeToken(networkType: NetworkType, chainId?: number) {
    switch (networkType) {
        case NetworkType.Solana:
            return SolanaChainResolver.nativeCurrency(solana.id);
        case NetworkType.Ethereum:
            return EVMChainResolver.nativeCurrency(chainId ?? mainnet.id);
        default:
            unreachable(networkType);
    }
}
