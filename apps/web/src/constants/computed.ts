import { solana } from '@dimensiondev/web3/chains';
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

export const TRACING_CHAINS = [mainnet.id, base.id, polygon.id, bsc.id, arbitrum.id, optimism.id, solana.id] as const;
