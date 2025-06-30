import { switchChain } from 'wagmi/actions';

import { chains, config } from '@/configs/wagmiClient.js';
import type { EthereumChainId } from '#masknet/web3-shared-evm';

export async function switchEthereumChain(chainId: EthereumChainId) {
    const chain = chains.find((chain) => chain.id === chainId);

    console.log('[switchEthereumChain] Switching to chain:', chainId, chain);

    await switchChain(config, {
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
