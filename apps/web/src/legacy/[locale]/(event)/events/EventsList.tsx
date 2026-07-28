'use client';

import { Agent, ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { getActivityListItem } from '@/components/Activity/ActivityListItem.js';
import { ActivityMobileNavigationBar } from '@/components/Activity/ActivityMobileNavigationBar.js';
import { useAgent } from '@/components/AgentProvider.js';
import { ListInPage } from '@/components/ListInPage.js';
import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import type { ActivityListInitialData } from '@/helpers/buildActivityListInitialData.js';
import { getFireflyActivityList } from '@/providers/firefly/activity/getFireflyActivityList.js';

interface EventsListProps {
    initialActivityListPage?: ActivityListInitialData;
}

export function EventsList({ initialActivityListPage }: EventsListProps) {
    const agent = useAgent();
    const isFireflyApp = agent === Agent.FireflyApp;
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['activity-list'],
        queryFn: async ({ pageParam }) => {
            return getFireflyActivityList({ indicator: createIndicator(undefined, pageParam) });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => compact(data.pages.flatMap((x) => x?.data)),
        initialData: initialActivityListPage,
        // SSR page is sliced to SSR_LIST_LIMIT items but keeps the full page's cursor, so
        // paginating from it would skip the rest of page one. Marking it stale triggers a
        // background refetch that restores the complete first page.
        initialDataUpdatedAt: initialActivityListPage ? 0 : undefined,
    });
    return (
        <div className="flex w-full flex-col">
            {isFireflyApp ? (
                <ActivityMobileNavigationBar>
                    <Trans>Exclusive Events</Trans>
                </ActivityMobileNavigationBar>
            ) : (
                <div className="sticky top-0 z-20 hidden h-[60px] w-full flex-row items-center bg-primaryBottom px-4 pt-2.5 text-xl font-bold md:flex">
                    <span>
                        <Trans>Exclusive Events</Trans>
                    </span>
                </div>
            )}
            <div className="mb-[72px] flex w-full flex-col px-4 pb-4">
                <ListInPage
                    source={Source.Wallet}
                    queryResult={queryResult}
                    VirtualListProps={{
                        listKey: `${ScrollListKey.Activity}`,
                        // Render the first screen during SSR. Without this react-virtuoso
                        // emits an empty list on the server (it measures in the browser).
                        initialItemCount: Math.min(queryResult.data.length, SSR_LIST_LIMIT),
                        computeItemKey: (_index, activity) => `${activity.id}-${activity.name}`,
                        itemContent: getActivityListItem,
                    }}
                    NoResultsFallbackProps={{
                        className: 'md:pt-[228px] max-md:py-20',
                    }}
                />
            </div>
        </div>
    );
}
