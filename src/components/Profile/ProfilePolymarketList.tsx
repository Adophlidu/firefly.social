'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useCallback } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { PolymarketActivityItem } from '@/components/Polymarket/PolymarketActivityItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { fireflyPolymarketProvider } from '@/providers/firefly/Polymarket.js';
import { captureProfilePolymarketLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

interface ProfilePolymarketListProps {
    address: string;
}

function getPolymarketItem(data: PolymarketActivity, onClick?: () => void) {
    return <PolymarketActivityItem activity={data} onPolymarketLinkClick={onClick} />;
}

export const ProfilePolymarketList = memo<ProfilePolymarketListProps>(function ProfilePolymarketList({ address }) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket', 'bets-list', address],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return fireflyPolymarketProvider.getProfilePolymarketTimeline(address, 'all', indicator);
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
            source={Source.Polymarket}
            key={Source.Polymarket}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Polymarket}:${address}`,
                computeItemKey: (index, data) => `${data.transactionHash}-${index}`,
                itemContent: (_, item) => getPolymarketItem(item, onPolymarketLinkClick),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
});
