import { createLookupTableResolver } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import { type Chain, createPublicClient as createClient, http, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';

import { chains } from '@/configs/chains.js';
import { getRPCConstant } from '@/web3-shared/evm/constants.js';
import { type EthereumChainId } from '@/web3-shared/evm/types.js';

const resolvePublicProviderUrl = createLookupTableResolver<number, string | undefined>(
    {
        [mainnet.id]: first(getRPCConstant(mainnet.id, 'RPC_URLS')),
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
