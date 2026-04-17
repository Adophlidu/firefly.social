import { chains } from '@dimensiondev/web3/chains';
import type { Config, Connector } from 'wagmi';
import { switchChain } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';

export async function switchEthereumChain(
    chainId: number,
    options?: {
        config?: Config;
        connector?: Connector;
    },
) {
    const chain = chains.find((chain) => chain.id === chainId);
    const currentConnectorChainId = options?.connector?.getChainId
        ? await options.connector.getChainId().catch(() => undefined)
        : undefined;
    const addEthereumChainParameter = chain
        ? {
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : [],
          }
        : undefined;

    if (options?.connector?.switchChain) {
        if (currentConnectorChainId === chainId) return;

        await options.connector.switchChain({
            chainId,
            addEthereumChainParameter,
        });
        return;
    }

    await switchChain(options?.config || wagmiConfig, {
        chainId,
        addEthereumChainParameter,
    });
}
