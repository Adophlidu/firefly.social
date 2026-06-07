import { ETHEREUM_RPC_URL, OPTIMISM_RPC_URL, POLYGON_RPC_URL } from '@dimensiondev/constants/static';

import { chains } from '@/chains/eth.js';

const HARDCODED_RPC_URLS: Record<number, string> = {
    1: ETHEREUM_RPC_URL,
    10: OPTIMISM_RPC_URL,
    137: POLYGON_RPC_URL,
};

export function resolvePublicRpcUrl(chainId: number): string | undefined {
    const hardcoded = HARDCODED_RPC_URLS[chainId];
    if (hardcoded) return hardcoded;
    return chains.find((x) => x.id === chainId)?.rpcUrls.default.http[0];
}
