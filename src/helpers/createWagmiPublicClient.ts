import { type Chain, createPublicClient as createClient, http, type PublicClient } from 'viem';

import { chains } from '@/configs/wagmiClient.js';
import { resolvePublicProviderUrl } from '@/helpers/resolvePublicProviderUrl.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

const map = new Map<number, PublicClient>();

export function createWagmiPublicClient(chainId: EthereumChainId): PublicClient {
    const client = map.get(chainId);
    if (client) return client;

    const chain = chains.find((x) => x.id === chainId) as Chain | undefined;

    const providerUrl = resolvePublicProviderUrl(chainId);
    const newClient = createClient({
        chain,
        transport: http(providerUrl, { batch: true }),
    });
    map.set(chainId, newClient);
    return newClient;
}
