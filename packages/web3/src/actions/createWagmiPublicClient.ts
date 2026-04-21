import type { Chain, PublicClient } from 'viem';
import { createPublicClient, http } from 'viem';

import { chains } from '@/chains/eth.js';

const map = new Map<string, PublicClient>();

export function createWagmiPublicClient(chainId: number, rpcUrl?: string): PublicClient {
    const cacheKey = `${chainId}:${rpcUrl ?? ''}`;
    const cached = map.get(cacheKey);
    if (cached) return cached;

    const chain = chains.find((x) => x.id === chainId) as Chain | undefined;
    const client = createPublicClient({
        chain,
        transport: http(rpcUrl || undefined, { batch: true }),
    });
    map.set(cacheKey, client);
    return client;
}
