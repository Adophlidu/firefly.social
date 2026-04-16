import { envs } from '@dimensiondev/envs';
import { createLookupTableResolver } from '@dimensiondev/utils';
import { chains } from '@dimensiondev/web3/chains';
import { type Chain, createPublicClient as createClient, http, type PublicClient } from 'viem';
import { mainnet, optimism, polygon } from 'viem/chains';

import type { EthereumChainId } from '@/web3-shared/evm/types.js';

const resolvePublicProviderUrl = createLookupTableResolver<number, string | undefined>(
    {
        [mainnet.id]: envs.external.NEXT_PUBLIC_MAINNET_RPC_URL,
        [optimism.id]: envs.external.NEXT_PUBLIC_OPTIMISM_RPC_URL,
        [polygon.id]: envs.external.NEXT_PUBLIC_POLYGON_RPC_URL,
    },
    undefined,
);

const map = new Map<string, PublicClient>();

export function createWagmiPublicClient(
    chainId: EthereumChainId,
    providerType: 'public' | 'default' = 'public',
): PublicClient {
    const cacheKey = providerType === 'default' ? `default-rpc-${chainId}` : `public-rpc-${chainId}`;

    const client = map.get(cacheKey);
    if (client) return client;

    const newClient = createClient({
        chain: chains.find((x) => x.id === chainId) as Chain | undefined,
        transport: http(providerType === 'default' ? undefined : resolvePublicProviderUrl(chainId), { batch: true }),
    });
    map.set(cacheKey, newClient);

    return newClient;
}
