'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { type TokenTrendingData, TokenTrendingListItem } from '@/components/TokenTrendingListItem.js';
import { ScrollListKey, Source, TrendingType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveCoinGeckoNetwork } from '@/helpers/resolveCoinGeckoNetwork.js';
import { getNewestTokens } from '@/providers/firefly/endpoint/getNewestTokens.js';
import { getStockTokens } from '@/providers/firefly/endpoint/getStockTokens.js';
import { getTopSearchTokens } from '@/providers/firefly/endpoint/getTopSearchTokens.js';
import { getTrendingTokens } from '@/providers/firefly/endpoint/getTrendingTokens.js';
import { useExploreTrendingFilterStore } from '@/store/useExploreTrendingFilterStore.js';

interface Props {
    type: TrendingType;
}

function getTokenTrendingItemContent(_: number, data: TokenTrendingData) {
    return <TokenTrendingListItem key={`${data.address}-${data.chainId}`} data={data} />;
}

export function TokenTrendingList(props: Props) {
    const { selectedChainId, selectedTimeRange } = useExploreTrendingFilterStore();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['explore-trending', props.type, selectedChainId, selectedTimeRange],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            const type = props.type;

            switch (type) {
                case TrendingType.Trending: {
                    return getTrendingTokens({
                        network: selectedChainId ? resolveCoinGeckoNetwork(selectedChainId) : undefined,
                        sort: selectedTimeRange,
                        indicator,
                    });
                }
                case TrendingType.Stocks:
                    return getStockTokens({
                        sort: selectedTimeRange,
                        indicator,
                    });
                case TrendingType.Newest:
                    return getNewestTokens({
                        network: selectedChainId ? resolveCoinGeckoNetwork(selectedChainId) : undefined,
                        indicator,
                    });
                case TrendingType.TopSearches:
                    return getTopSearchTokens({ indicator });

                default:
                    safeUnreachable(type);
                    return createPageable<TokenTrendingData>(EMPTY_LIST, indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return undefined;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => data.pages.flatMap((x) => x?.data || []),
        networkMode: 'always',
        staleTime: 0,
        gcTime: 0,
    });

    const listKey = `${ScrollListKey.TokenTrending}:${props.type}:${selectedChainId}:${selectedTimeRange}`;

    return (
        <div>
            <div className="mt-3 flex px-4">
                <div className="font-inter text-[13px] leading-[17px] text-secondary">
                    <Trans>Volume · MC</Trans>
                </div>
                <div className="ml-auto text-right font-inter text-[13px] leading-[17px] text-secondary">
                    <Trans>Price · Change</Trans>
                </div>
            </div>

            <ListInPage
                source={Source.Tokens}
                queryResult={queryResult}
                VirtualListProps={{
                    listKey,
                    computeItemKey: (index, item) => `${item.address}-${item.chainId}-${index}`,
                    itemContent: getTokenTrendingItemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No tokens found</Trans>,
                }}
            />
        </div>
    );
}
