import { createLookupTableResolver } from '@dimensiondev/utils';
import { chains } from '@dimensiondev/web3/chains';
import { mainnet, monadTestnet, optimism, polygon } from 'viem/chains';

import { env } from '@/constants/env.js';

const resolve = createLookupTableResolver<number, string | null>(
    {
        [mainnet.id]: env.external.NEXT_PUBLIC_MAINNET_RPC_URL,
        [optimism.id]: env.external.NEXT_PUBLIC_OPTIMISM_RPC_URL,
        [polygon.id]: env.external.NEXT_PUBLIC_POLYGON_RPC_URL,
        [monadTestnet.id]: env.external.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL,
    },
    null,
);

export function resolvePublicProviderUrl(chainId: number) {
    const resolved = resolve(chainId);
    if (resolved) return resolved;
    const rpc = chains.find((x) => x.id === chainId)?.rpcUrls.default.http[0];
    if (!rpc) {
        throw new Error(`Chain ${chainId} not found`);
    }
    return rpc;
}
