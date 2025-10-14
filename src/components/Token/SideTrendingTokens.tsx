'use client';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { SearchableTokenItem } from '@/components/Search/SearchableTokenItem.js';
import { Link } from '@/esm/Link.js';
import { CoinGecko } from '@/providers/coingecko/index.js';

export function SideTrendingTokens() {
    const { data, isFetching } = useSuspenseQuery({
        queryKey: ['side-trending-tokens'],
        queryFn: () => CoinGecko.getTopTrendingCoins(),
        select: (data) => data.slice(0, 5),
    });

    if (!data.length && !isFetching) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex px-2">
                <div className="text-xl font-bold leading-6 text-main">
                    <Trans>Trending Token</Trans>
                </div>
                <Link href="/explore/tokens/trending" className="ml-auto text-medium font-bold text-highlight">
                    <Trans>More</Trans>
                </Link>
            </div>
            <div>
                {data.map((x) => (
                    <SearchableTokenItem
                        className="px-2"
                        key={x.id}
                        token={x}
                        showSymbol={false}
                        showRank={false}
                        showMarketInfo
                    />
                ))}
            </div>
        </div>
    );
}
