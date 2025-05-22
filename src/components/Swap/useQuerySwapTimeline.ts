import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface Options {
    isFollowing: boolean;
    address: string;
    chainId: number;
    tokenAddress: string;
    size?: number;
}
export function useQuerySwapTimeline({ isFollowing, address, chainId, tokenAddress, size }: Options) {
    const profileIds = useCurrentProfileIds();
    const isLoginFirefly = useIsLoginFirefly();
    const queryKey = isFollowing
        ? ['swaps', 'following', profileIds, chainId, tokenAddress, isLoginFirefly, size]
        : ['swaps', 'profile', address, profileIds, chainId, tokenAddress, size];

    return useSuspenseInfiniteQuery({
        queryKey,
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            if ((isFollowing && !isLoginFirefly) || (!isFollowing && !address)) return null;

            if (!isFollowing && address) {
                return FireflyEndpointProvider.getSwapTimelineByAddress(
                    address,
                    chainId ? [chainId] : [],
                    tokenAddress,
                    createIndicator(undefined, pageParam),
                    size,
                );
            } else {
                return FireflyEndpointProvider.getFollowingSwapTimeline(
                    chainId ? [chainId] : [],
                    tokenAddress,
                    createIndicator(undefined, pageParam),
                    size,
                );
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => compact(data.pages.flatMap((p) => p?.data)),
    });
}
