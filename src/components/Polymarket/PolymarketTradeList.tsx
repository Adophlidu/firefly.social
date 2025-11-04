'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { PolymarketTradeItem } from '@/components/Polymarket/PolymarketTradeItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { PolymarketTradeData } from '@/providers/types/Firefly.js';

interface PolymarketTradeListProps {
    address: string;
}

const getTradeItem = (index: number, trade: PolymarketTradeData, listKey: string) => {
    return (
        <PolymarketTradeItem
            className={index % 2 === 0 ? 'bg-lightBg' : ''}
            trade={trade}
            key={`${trade.slug}-${index}`}
        />
    );
};

export function PolymarketTradeList({ address }: PolymarketTradeListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket', 'trades', address],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await fireflyEndpointProvider.getPolymarketTradeHistory({ address, limit: 25, indicator });
            } catch {
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    if (!queryResult.isFetchingNextPage && queryResult.isFetching) {
        return <Loading />;
    }

    return (
        <>
            <div className="hidden items-center p-4 md:flex">
                <span className="w-[130px] text-[11px] uppercase text-second">
                    <Trans>ACTIVITY</Trans>
                </span>
                <span className="flex-1 text-[11px] uppercase text-second">
                    <Trans>MARKET</Trans>
                </span>
                <span className="w-[176px] pl-6 text-[11px] uppercase text-second">
                    <Trans>VALUE</Trans>
                </span>
            </div>
            <ListInPage
                source={Source.Polymarket}
                key={Source.Polymarket}
                queryResult={queryResult}
                VirtualListProps={{
                    useWindowScroll: true,
                    listKey: `${ScrollListKey.Polymarket}:trades`,
                    computeItemKey: (index, trade) => `${trade.slug}-${index}`,
                    itemContent: (index, trade) => getTradeItem(index, trade, `${ScrollListKey.Polymarket}:trades`),
                }}
                NoResultsFallbackProps={{
                    className: 'mt-20',
                    message: <Trans>No trades yet</Trans>,
                }}
            />
        </>
    );
}
