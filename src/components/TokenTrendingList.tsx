import { useSuspenseQuery } from '@tanstack/react-query';

import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { SearchableTokenItem } from '@/components/Search/SearchableTokenItem.js';
import { VirtualListFooterBottomText } from '@/components/VirtualList/VirtualListFooterBottomText.js';
import { TrendingType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import type { TokenWithMarket } from '@/services/searchTokens.js';

interface Props {
    type: TrendingType.TopGainers | TrendingType.TopLosers | TrendingType.Trending | TrendingType.Meme;
}

export function TokenTrendingList(props: Props) {
    const { data, isFetching } = useSuspenseQuery({
        queryKey: ['explore-trending', props.type],
        queryFn: async () => {
            const type = props.type;
            switch (type) {
                case TrendingType.TopGainers:
                case TrendingType.TopLosers:
                    return CoinGecko.getTopGainersOrLosers(type);
                case TrendingType.Trending:
                    return CoinGecko.getTopTrendingCoins();
                case TrendingType.Meme:
                    return CoinGecko.getTopMemeCoins();
                default:
                    safeUnreachable(type);
                    return EMPTY_LIST as TokenWithMarket[];
            }
        },
        networkMode: 'always',
        staleTime: 0,
        gcTime: 0,
    });

    if (!data.length && !isFetching) {
        return <NoResultsFallback />;
    }

    return (
        <div>
            {data.map((x) => (
                <SearchableTokenItem className="border-b border-line" key={x.id} token={x} />
            ))}

            <VirtualListFooterBottomText />
        </div>
    );
}
