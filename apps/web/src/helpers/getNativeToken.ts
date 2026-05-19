import { NetworkType } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { EthChainResolver, SolanaChainResolver } from '@dimensiondev/web3/resolvers';
import { mainnet } from 'viem/chains';

export function getNativeToken(networkType: NetworkType, chainId?: number) {
    switch (networkType) {
        case NetworkType.Solana:
            return SolanaChainResolver.nativeCurrency(solana.id);
        case NetworkType.Ethereum:
            return EthChainResolver.nativeCurrency(chainId ?? mainnet.id);
        default:
            unreachable(networkType);
    }
}
