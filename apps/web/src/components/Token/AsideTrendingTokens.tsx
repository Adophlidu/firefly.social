'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { AsideTitle } from '@/components/AsideTitle.js';
import { AsideTokensSkeleton } from '@/components/Token/AsideTokensSkeleton.js';
import { TokenTrendingListItem } from '@/components/TokenTrendingListItem.js';
import { Link } from '@/esm/Link.js';
import { getTopTrendingCoins } from '@/providers/coingecko/getTopTrendingCoins.js';

export default memo(function AsideTrendingTokens() {
    const { data, isFetching } = useQuery({
        queryKey: ['side-trending-tokens'],
        queryFn: () => getTopTrendingCoins(),
        select: (data) => data.slice(0, 5),
    });

    if (isFetching) return <AsideTokensSkeleton />;

    if (!data?.length) return null;

    return (
        <div className="flex flex-col gap-2">
            <AsideTitle
                caption={<Trans>Trending Token</Trans>}
                more={
                    <Link href="/explore/tokens/trending" className="text-medium text-highlight">
                        <Trans>More</Trans>
                    </Link>
                }
            />
            <div>
                {data.map((x) => (
                    <TokenTrendingListItem key={x.address} data={x} className="border-none p-3 px-2" />
                ))}
            </div>
        </div>
    );
});
