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
import { getFireflyActivityList } from '@/providers/firefly/activity/getFireflyActivityList.js';

export function EventsList() {
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
