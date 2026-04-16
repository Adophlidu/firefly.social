import { chains } from '@dimensiondev/web3/chains';
import { createConfig } from '@privy-io/wagmi';
import { createStorage } from '@wagmi/core';
import { http, type Transport } from 'viem';
import { mainnet, optimism, polygon } from 'viem/chains';

import { env } from '@/constants/env.js';

type ChainIds = (typeof chains)[number]['id'];

const storage = createStorage({
    key: 'firefly-wallet',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});

function resolveHttpTransport(chainId: ChainIds): Transport {
    switch (chainId) {
        case mainnet.id:
            return http(env.external.NEXT_PUBLIC_MAINNET_RPC_URL);
        case optimism.id:
            return http(env.external.NEXT_PUBLIC_OPTIMISM_RPC_URL);
        case polygon.id:
            return http(env.external.NEXT_PUBLIC_POLYGON_RPC_URL);
        default:
            return http();
    }
}

export const config = createConfig({
    chains,
    transports: Object.fromEntries(
        chains.map((chain) => [chain.id, resolveHttpTransport(chain.id)] as [ChainIds, Transport]),
    ) as Record<ChainIds, Transport>,
    storage,
});
