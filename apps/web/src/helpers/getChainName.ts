import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { SolanaChainResolver } from '@/web3-providers/solana/ResolverAPI.js';

export function getChainName(chainId: number, useChainIdAsFallback = true) {
    const isSolanaChain = isValidChainIdSolana(chainId);
    const chainName = runInSafe(() =>
        isSolanaChain ? SolanaChainResolver.chainName(chainId) : EVMChainResolver.chainName(chainId),
    );

    return chainName || (useChainIdAsFallback ? `${chainId}` : null);
}
