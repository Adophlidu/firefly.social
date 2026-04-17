import { chains } from '@dimensiondev/web3/chains';
import type { Config, Connector } from 'wagmi';
import { switchChain } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { logger } from '@/lib/Logger.js';

export async function switchEthereumChain(
    chainId: number,
    options?: {
        config?: Config;
        connector?: Connector;
    },
) {
    const chain = chains.find((chain) => chain.id === chainId);
    const addEthereumChainParameter = chain
        ? {
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : [],
          }
        : undefined;

    logger.info('[switchEthereumChain] Switching to chain:', chainId, chain);

    if (options?.connector?.switchChain) {
        const currentChainId = await options.connector.getChainId().catch(() => undefined);
        if (currentChainId === chainId) return;

        await options.connector.switchChain({
            chainId,
            addEthereumChainParameter,
        });
        return;
    }

    await switchChain(options?.config || config, {
        chainId,
        addEthereumChainParameter,
    });
}
