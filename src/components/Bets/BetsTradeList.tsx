'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { BetsTradeItem } from '@/components/Bets/BetsTradeItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { type BetsPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { getBetsTimelineByAddress } from '@/providers/firefly/bets/getBetsTimelineByAddress.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

interface BetsTradeListProps {
    address: string;
    platform: BetsPlatform;
}
interface Options {
    trade: BetsActivity;
    listKey: string;
    platform: BetsPlatform;
    index: number;
}

const getTradeItem = ({ trade, platform, index }: Options) => {
    return <BetsTradeItem trade={trade} key={`${trade.slug}-${index}`} platform={platform} />;
};

export function BetsTradeList({ address, platform }: BetsTradeListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'trades', address.toLowerCase()],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getBetsTimelineByAddress({
                    walletAddresses: [address],
                    platforms: [platform],
                    indicator,
                    size: 15,
                });
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
                <span className="w-[176px] pl-6 text-right text-[11px] uppercase text-second">
                    <Trans>TOTAL</Trans>
                </span>
            </div>
            <ListInPage
                source={Source.Bets}
                key={Source.Bets}
                queryResult={queryResult}
                VirtualListProps={{
                    useWindowScroll: true,
                    listKey: `${ScrollListKey.Bets}:trades`,
                    computeItemKey: (index, trade) => `${trade.slug}-${index}`,
                    itemContent: (index, trade) =>
                        getTradeItem({
                            index,
                            trade,
                            listKey: `${ScrollListKey.Bets}:trades`,
                            platform,
                        }),
                }}
                NoResultsFallbackProps={{
                    className: 'mt-20',
                    message: <Trans>No trades found in this wallet</Trans>,
                    icon: <div />,
                }}
            />
        </>
    );
}
