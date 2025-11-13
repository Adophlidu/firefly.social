import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { TokenTrendingListItem } from '@/components/TokenTrendingListItem.js';
import { VirtualListFooterBottomText } from '@/components/VirtualList/VirtualListFooterBottomText.js';
import { TrendingType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { resolveCoinGeckoNetwork } from '@/helpers/resolveCoinGeckoNetwork.js';
import { getNewestTokens } from '@/providers/firefly/endpoint/getNewestTokens.js';
import { getStockTokens } from '@/providers/firefly/endpoint/getStockTokens.js';
import { getTopSearchTokens } from '@/providers/firefly/endpoint/getTopSearchTokens.js';
import { getTrendingTokens } from '@/providers/firefly/endpoint/getTrendingTokens.js';
import { useExploreTrendingFilterStore } from '@/store/useExploreTrendingFilterStore.js';

interface Props {
    type: TrendingType;
}

export function TokenTrendingList(props: Props) {
    const { selectedChainId, selectedTimeRange } = useExploreTrendingFilterStore();
    const { data } = useSuspenseQuery({
        queryKey: ['explore-trending', props.type, selectedChainId, selectedTimeRange],
        queryFn: async () => {
            const type = props.type;

            switch (type) {
                case TrendingType.Trending: {
                    return getTrendingTokens({
                        network: selectedChainId ? resolveCoinGeckoNetwork(selectedChainId) : undefined,
                        sort: selectedTimeRange,
                    });
                }
                case TrendingType.Stocks:
                    return getStockTokens({
                        sort: selectedTimeRange,
                    });
                case TrendingType.Newest:
                    return getNewestTokens({
                        network: selectedChainId ? resolveCoinGeckoNetwork(selectedChainId) : undefined,
                    });
                case TrendingType.TopSearches:
                    return getTopSearchTokens();

                default:
                    safeUnreachable(type);
                    return EMPTY_LIST;
            }
        },
        networkMode: 'always',
        staleTime: 0,
        gcTime: 0,
    });
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

            {data.map((x, index) => (
                <TokenTrendingListItem key={index} data={x} />
            ))}

            <VirtualListFooterBottomText />
        </div>
    );
}
