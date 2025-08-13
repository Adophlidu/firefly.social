'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useLayoutEffect } from 'react';

import SwapEmptyIcon from '@/assets/swap-empty.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ListInPage, type ListInPageProps } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { SwapActivityItem } from '@/components/Swap/SwapActivityItem.js';
import { ExploreType, ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { useRouter } from '@/esm/navigation.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { useSwapStateStore } from '@/store/useSwapStore.js';

function getSwapActivityItemContent(index: number, activity: SwapActivity, disableScrollRestore?: boolean) {
    return <SwapActivityItem activity={activity} disableScrollRestore={disableScrollRestore} />;
}

export type SwapTimelineProps = {
    NoResultsFallbackProps?: ListInPageProps['NoResultsFallbackProps'];
    chainId?: number;
    tokenAddress?: string;
    listSubScope?: string; // to isolate among lists
    disableScrollRestore?: boolean;
    /** ignore filter options from SwapStateStore */
    ignoreFilters?: boolean;
    onActivitiesUpdate?: (data: SwapActivity[]) => void;
} & (
    | {
          address: string;
          isFollowing?: false;
      }
    | {
          address?: string;
          isFollowing: true;
      }
);

export function SwapTimeline({
    isFollowing,
    address,
    chainId: propChainId,
    tokenAddress,
    listSubScope = '',
    disableScrollRestore,
    ignoreFilters,
    NoResultsFallbackProps,
    onActivitiesUpdate,
}: SwapTimelineProps) {
    const isLoginFirefly = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();
    const { selectedChainId } = useSwapStateStore();
    const chainId = ignoreFilters ? propChainId : propChainId || selectedChainId;
    const router = useRouter();
    const queryKey = isFollowing
        ? ['swaps', 'following', profileIds, chainId, tokenAddress]
        : ['swaps', 'profile', address, profileIds, chainId, tokenAddress];

    const queryResult = useSuspenseInfiniteQuery({
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
                );
            } else {
                return FireflyEndpointProvider.getFollowingSwapTimeline(
                    chainId ? [chainId] : [],
                    tokenAddress,
                    createIndicator(undefined, pageParam),
                );
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => compact(data.pages.flatMap((p) => p?.data)),
    });

    useLayoutEffect(() => {
        onActivitiesUpdate?.(queryResult.data);
        return () => {
            onActivitiesUpdate?.(EMPTY_LIST);
        };
    }, [onActivitiesUpdate, queryResult.data]);

    if (!isLoginFirefly && isFollowing) {
        return <NotLoginFallback source={Source.Swap} />;
    }

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            NoResultsFallbackProps={{
                icon: isFollowing ? <SwapEmptyIcon width={134} height={144} className="mt-3" /> : null,
                message: isFollowing ? (
                    <div className="mt-1 flex flex-col items-center gap-6">
                        <Trans>Explore and follow accounts to see the feed</Trans>
                        <ClickableButton
                            onClick={() => {
                                router.push(resolveExploreUrl(ExploreType.TopProfiles));
                            }}
                            className="leading-12 h-12 min-w-[100px] rounded-2xl bg-main px-5 text-primaryBottom"
                        >
                            <Trans>Explore</Trans>
                        </ClickableButton>
                    </div>
                ) : (
                    <Trans>No activity yet</Trans>
                ),
                ...NoResultsFallbackProps,
            }}
            VirtualListProps={{
                listKey: `${ScrollListKey.Swap}:${listSubScope}:${isFollowing ? 'following' : 'profile'}`,
                computeItemKey: (index, item) => `${item.hash}-${index}`,
                itemContent: (index, item) => getSwapActivityItemContent(index, item, disableScrollRestore),
            }}
        />
    );
}
