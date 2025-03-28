'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useRouter } from 'next/navigation.js';

import SwapEmptyIcon from '@/assets/swap-empty.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ListInPage } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { SwapActivityItem } from '@/components/Swap/SwapActivityItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { DEFAULT_EXPLORE_TYPE } from '@/constants/index.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { useSwapStateStore } from '@/store/useSwapStore.js';

export function getSwapActivityItemContent(index: number, activity: SwapActivity) {
    return <SwapActivityItem activity={activity} />;
}

type SwapTimelineProps =
    | {
          address: string;
          isFollowing?: false;
      }
    | {
          address?: string;
          isFollowing: true;
      };

export function SwapTimeline({ isFollowing, address }: SwapTimelineProps) {
    const isLoginFirefly = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();
    const { selectedChainId } = useSwapStateStore();
    const router = useRouter();
    const queryKey = isFollowing
        ? ['swap', 'following', profileIds, selectedChainId]
        : ['swap', 'profile', address, profileIds, selectedChainId];

    const queryResult = useSuspenseInfiniteQuery({
        queryKey,
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            if ((isFollowing && !isLoginFirefly) || (!isFollowing && !address)) return;

            if (!isFollowing && address) {
                return FireflyEndpointProvider.getSwapTimelineByAddress(
                    address,
                    selectedChainId ? [selectedChainId] : [],
                    createIndicator(undefined, pageParam),
                );
            } else {
                return FireflyEndpointProvider.getFollowingSwapTimeline(
                    selectedChainId ? [selectedChainId] : [],
                    createIndicator(undefined, pageParam),
                );
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => compact(data.pages.flatMap((p) => p?.data)),
    });

    if (!isLoginFirefly && isFollowing) {
        return <NotLoginFallback source={Source.Swap} />;
    }

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            NoResultsFallbackProps={{
                icon: isFollowing ? <SwapEmptyIcon width={134} height={144} /> : null,
                message: isFollowing ? (
                    <div className="mt-10 flex flex-col items-center gap-6">
                        <Trans>Explore and follow accounts to see the feed</Trans>
                        <ClickableButton
                            onClick={() => {
                                router.push(resolveExploreUrl(DEFAULT_EXPLORE_TYPE));
                            }}
                            className="rounded-md bg-main px-2 py-1 text-primaryBottom"
                        >
                            <Trans>Explore</Trans>
                        </ClickableButton>
                    </div>
                ) : (
                    <Trans>No activity yet</Trans>
                ),
            }}
            VirtualListProps={{
                listKey: `${ScrollListKey.Swap}:${isFollowing ? 'following' : 'profile'}`,
                computeItemKey: (index, item) => `${item.hash}-${index}`,
                itemContent: (index, item) => getSwapActivityItemContent(index, item),
            }}
        />
    );
}
