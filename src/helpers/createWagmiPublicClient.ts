import { ChainId } from '@masknet/web3-shared-evm';
import { type Chain, createPublicClient as createClient, http, type PublicClient } from 'viem';

import { chains } from '@/configs/wagmiClient.js';
import { resolveRPCUrl } from '@/helpers/resolveRPCUrl.js';

const map = new Map<number, PublicClient>();

export function createWagmiPublicClient(chainId: ChainId): PublicClient {
    const chain = chains.find((x) => x.id === chainId) as Chain | undefined;
    if (!chain) throw new Error(`Unsupported chainId = ${chainId}`);

    const client = map.get(chainId);
    if (client) return client;

    const providerUrl = resolveRPCUrl(chainId);
    if (!providerUrl) throw new Error(`No provider url found for chain ${chainId}`);

    const newClient = createClient({
        chain,
        transport: http(providerUrl, { batch: true }),
    });
    map.set(chainId, newClient);
    return newClient;
}
