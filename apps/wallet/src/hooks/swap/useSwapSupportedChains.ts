'use client';

import { useQuery } from '@tanstack/react-query';

import type { SupportedChain } from '@/providers/swap/types.js';
import { getSwapEndpoint } from '@/store/swapEndpoint.js';

/**
 * Shared hook for fetching swap-supported chains from the backend API.
 * Used by both the Swap select-token page and the Receive modal to ensure
 * they display the same set of supported chains.
 */
export function useSwapSupportedChains(): {
    data: SupportedChain[];
    isLoading: boolean;
} {
    const { data = [], isLoading } = useQuery({
        queryKey: ['swap-supported-chains'],
        queryFn: async () => {
            const endpoint = getSwapEndpoint();
            return endpoint.getSupportedChains();
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
    });

    return { data, isLoading };
}
