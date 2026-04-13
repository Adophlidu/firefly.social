'use client';

import SwapEmptyIcon from '@dimensiondev/assets/swap-empty.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useLayoutEffect } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ListInPage, type ListInPageProps } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { SwapActivityItem } from '@/components/Swap/SwapActivityItem.js';
import { ExploreType, ScrollListKey, Source } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { getFollowingSwapTimeline } from '@/providers/firefly/endpoint/getFollowingSwapTimeline.js';
import { getSwapTimelineByAddress } from '@/providers/firefly/endpoint/getSwapTimelineByAddress.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { useTransactionsStateStore } from '@/store/useTransactionsStore.js';

function getSwapActivityItemContent(index: number, activity: SwapActivity) {
    return <SwapActivityItem activity={activity} />;
}

export type SwapTimelineProps = {
    NoResultsFallbackProps?: ListInPageProps['NoResultsFallbackProps'];
    chainId?: number;
    tokenAddress?: string;
    listSubScope?: string; // to isolate among lists
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
    ignoreFilters,
    NoResultsFallbackProps,
    onActivitiesUpdate,
}: SwapTimelineProps) {
    const isLoginFirefly = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();
    const { selectedChainId } = useTransactionsStateStore();
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
                return getSwapTimelineByAddress(
                    address,
                    chainId ? [chainId] : [],
                    tokenAddress,
                    createIndicator(undefined, pageParam),
                );
            } else {
                return getFollowingSwapTimeline(
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
                            className="leading-12 bg-main text-primaryBottom h-12 min-w-[100px] rounded-2xl px-5"
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
                itemContent: (index, item) => getSwapActivityItemContent(index, item),
            }}
        />
    );
}
