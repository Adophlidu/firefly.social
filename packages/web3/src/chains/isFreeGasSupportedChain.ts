import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

const FREE_GAS_SUPPORTED_CHAIN_IDS = [mainnet.id, bsc.id, base.id, optimism.id, polygon.id, arbitrum.id] as const;

export function isFreeGasSupportedChain(chainId: number): boolean {
    return (FREE_GAS_SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId);
}
