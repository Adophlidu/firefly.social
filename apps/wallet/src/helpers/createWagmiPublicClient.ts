import { chains } from '@dimensiondev/web3/chains';
import { resolvePublicProviderUrl } from '@dimensiondev/web3/utils';
import { type Chain, createPublicClient as createClient, http, type PublicClient } from 'viem';
import { mainnet, monadTestnet, optimism, polygon } from 'viem/chains';

import { env } from '@/constants/env.js';

const rpcUrlOverrides = {
    [mainnet.id]: env.external.NEXT_PUBLIC_MAINNET_RPC_URL,
    [optimism.id]: env.external.NEXT_PUBLIC_OPTIMISM_RPC_URL,
    [polygon.id]: env.external.NEXT_PUBLIC_POLYGON_RPC_URL,
    [monadTestnet.id]: env.external.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL,
};

const map = new Map<number, PublicClient>();

export function createWagmiPublicClient(chainId: number): PublicClient {
    const client = map.get(chainId);
    if (client) return client;

    const chain = chains.find((x) => x.id === chainId) as Chain | undefined;

    const providerUrl = resolvePublicProviderUrl(chainId, rpcUrlOverrides);
    const newClient = createClient({
        chain,
        transport: http(providerUrl || undefined, { batch: true }),
    });
    map.set(chainId, newClient);
    return newClient;
}
