import { useQuery } from '@tanstack/react-query';
import { base, mainnet, polygon } from 'viem/chains';

import { createSwapEndpoint } from '@/providers/swap/swapEndpoint.js';

interface Options {
    enabled?: boolean;
    chainId?: number;
}
interface TrendingTokenItem {
    address: string;
    chainId: number;
}

const TRENDING_TOKENS: TrendingTokenItem[] = [
    { chainId: mainnet.id, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }, // USDC
    { chainId: mainnet.id, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }, // USDT
    { chainId: polygon.id, address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' }, // USDC
    { chainId: polygon.id, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' }, // USDT
    { chainId: base.id, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }, // USDC
    { chainId: base.id, address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' }, // USDT
];

export function useTrendingTokensForWithdraw({ enabled = false, chainId }: Options) {
    return useQuery({
        queryKey: ['trending-tokens-for-withdraw'],
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        queryFn: async () => {
            return createSwapEndpoint().getTokenDetailBatch(
                TRENDING_TOKENS.map((t) => ({
                    ...t,
                    chainId: String(t.chainId),
                })),
            );
        },
        select: (data) => {
            if (!chainId || !data?.length) return data;

            return data.filter((token) => token.chainId === chainId);
        },
    });
}
