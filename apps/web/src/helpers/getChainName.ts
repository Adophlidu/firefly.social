import { runInSafe } from '@dimensiondev/utils';
import { isValidChainIdSolana } from '@dimensiondev/web3/chains';
import { EthChainResolver, SolanaChainResolver } from '@dimensiondev/web3/resolvers';

export function getChainName(chainId: number, useChainIdAsFallback = true) {
    const isSolanaChain = isValidChainIdSolana(chainId);
    const chainName = runInSafe(() =>
        isSolanaChain ? SolanaChainResolver.chainName(chainId) : EthChainResolver.chainName(chainId),
    );

    return chainName || (useChainIdAsFallback ? `${chainId}` : null);
}
