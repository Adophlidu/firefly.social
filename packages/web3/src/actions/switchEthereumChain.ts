import type { Config, Connector } from 'wagmi';
import { switchChain } from 'wagmi/actions';

import { chains } from '@/chains.js';

export async function switchEthereumChain(
    config: Config,
    chainId: number,
    options?: { connector?: Connector },
): Promise<void> {
    const chain = chains.find((chain) => chain.id === chainId);
    const connector = options?.connector;
    const addEthereumChainParameter = chain
        ? {
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : [],
          }
        : undefined;

    if (connector?.switchChain) {
        const currentChainId = await connector.getChainId().catch(() => undefined);
        if (currentChainId === chainId) return;

        await connector.switchChain({ chainId, addEthereumChainParameter });
        return;
    }

    await switchChain(config, { chainId, addEthereumChainParameter });
}
