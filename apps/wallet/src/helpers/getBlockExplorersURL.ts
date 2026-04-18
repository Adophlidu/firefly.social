import { chains, solana } from '@dimensiondev/web3/chains';
import urlcat from 'urlcat';

export function getBlockExplorersURL(chainId: number, id: string, type: 'address' | 'tx') {
    if (chainId === solana.id) {
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
