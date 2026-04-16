import { chains } from '@dimensiondev/web3/chains';
import { type Chain, createPublicClient as createClient, http, type PublicClient } from 'viem';

import type { EthereumChainId } from '@/constants/ethereum.js';
import { resolvePublicProviderUrl } from '@/helpers/resolvePublicProviderUrl.js';

const map = new Map<number, PublicClient>();

export function createWagmiPublicClient(chainId: EthereumChainId): PublicClient {
    const client = map.get(chainId);
    if (client) return client;

    const chain = chains.find((x) => x.id === chainId) as Chain | undefined;

    const providerUrl = resolvePublicProviderUrl(chainId);
    const newClient = createClient({
        chain,
        transport: http(providerUrl || undefined, { batch: true }),
    });
    map.set(chainId, newClient);
    return newClient;
}
