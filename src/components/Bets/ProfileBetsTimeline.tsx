'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useCallback } from 'react';

import { BetsActivityItem } from '@/components/Bets/BetsActivityItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { getBetsTimelineByAddress } from '@/providers/firefly/bets/getBetsTimelineByAddress.js';
import { captureProfilePolymarketLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';
import { BetsFilterNamespace, useBetsSourceFilterStore } from '@/store/useBetsSourceFilterStore.js';

interface ProfileBetsTimelineProps {
    address: string;
}

function getBetsActivityItem(data: BetsActivity, onClick?: () => void) {
    return <BetsActivityItem activity={data} onLinkClick={onClick} />;
}

export const ProfileBetsTimeline = memo<ProfileBetsTimelineProps>(function ProfileBetsTimeline({ address }) {
    const { platforms } = useBetsSourceFilterStore(BetsFilterNamespace.Profile);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'list', 'profile', address.toLowerCase(), platforms.join(',')],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return getBetsTimelineByAddress({
                walletAddresses: [address],
                indicator,
                platforms,
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const onPolymarketLinkClick = useCallback(() => {
        captureProfilePolymarketLinkClick();
    }, []);

    return (
        <ListInPage
            source={Source.Bets}
            key={Source.Bets}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Bets}:${address}`,
                computeItemKey: (index, data) => `${data.transactionHash}-${index}`,
                itemContent: (_, item) => getBetsActivityItem(item, onPolymarketLinkClick),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
});
