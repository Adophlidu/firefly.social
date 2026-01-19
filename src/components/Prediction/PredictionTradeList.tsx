'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { PredictionTradeItem } from '@/components/Prediction/PredictionTradeItem.js';
import { type PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { getPredictionTimelineByAddress } from '@/providers/firefly/prediction/getPredictionTimelineByAddress.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

interface PredictionTradeListProps {
    address: string;
    platform: PredictionPlatform;
}
interface Options {
    trade: BetsActivity;
    listKey: string;
    platform: PredictionPlatform;
    index: number;
}

const getTradeItem = ({ trade, platform, index }: Options) => {
    return <PredictionTradeItem trade={trade} key={`${trade.slug}-${index}`} platform={platform} />;
};

export function PredictionTradeList({ address, platform }: PredictionTradeListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'trades', address.toLowerCase()],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getPredictionTimelineByAddress({
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
                source={Source.Prediction}
                key={Source.Prediction}
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
