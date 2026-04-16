import { chains } from '@dimensiondev/web3/chains';
import type { Config } from 'wagmi';
import { switchChain } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { logger } from '@/libs/Logger.js';

export async function switchEthereumChain(
    chainId: number,
    options?: {
        config?: Config;
    },
) {
    const chain = chains.find((chain) => chain.id === chainId);

    logger.debug('[switchEthereumChain] Switching to chain:', chainId, chain);

    await switchChain(options?.config || wagmiConfig, {
        chainId,
        addEthereumChainParameter: chain
            ? {
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: chain.rpcUrls.default.http,
                  blockExplorerUrls: chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : [],
              }
            : undefined,
    });
}
