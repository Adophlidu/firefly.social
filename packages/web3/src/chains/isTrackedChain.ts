import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

import { solana } from '@/chains/sol.js';

const TRACKED_CHAIN_IDS = [mainnet.id, base.id, polygon.id, bsc.id, arbitrum.id, optimism.id, solana.id] as const;

export function isTrackedChain(chainId: number | null | undefined): boolean {
    return typeof chainId === 'number' && TRACKED_CHAIN_IDS.includes(chainId as (typeof TRACKED_CHAIN_IDS)[number]);
}
