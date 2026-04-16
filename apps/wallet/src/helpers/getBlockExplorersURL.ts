import { chains } from '@dimensiondev/web3/chains';
import urlcat from 'urlcat';

import type { EthereumChainId } from '@/constants/ethereum.js';
import { SolanaChainId } from '@/constants/solana.js';

export function getBlockExplorersURL(
    chainId: EthereumChainId | SolanaChainId.Mainnet,
    id: string,
    type: 'address' | 'tx',
) {
    if (chainId === SolanaChainId.Mainnet) {
        const baseURL = 'https://solscan.io';
        if (type === 'address') {
            return urlcat(baseURL, `/account/:id`, { type, id });
        }
        return urlcat(baseURL, `/:type/:id`, { type, id });
    }
    const explorerURL = chains.find((chain) => chain.id === chainId)?.blockExplorers.default.url;
    if (!explorerURL) {
        throw new Error(`Chain ${chainId} not found`);
    }
    return urlcat(explorerURL, `/:type/:id`, { type, id });
}
