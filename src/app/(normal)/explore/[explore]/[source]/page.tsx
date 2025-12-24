'use client';

import { use } from 'react';

import { ExplorePage } from '@/app/(normal)/explore/pages/Explore.js';
import { EXPLORE_SOURCES } from '@/constants/computed.js';
import { type ExploreSource, type ExploreSourceInURL, ExploreType, type TrendingType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ source: string; explore: ExploreType }> {}

export default function Page(props: Props) {
    const { source, explore } = use(props.params);

    if (explore === ExploreType.Bets) {
        return <ExplorePage source={source} type={explore} />;
    }

    const validSources = EXPLORE_SOURCES[explore];
    const exploreSource =
        explore === ExploreType.CryptoTrends
            ? (source as TrendingType)
            : (resolveSourceFromUrl(source as ExploreSourceInURL) as ExploreSource);
    if (validSources?.length && !validSources.includes(exploreSource)) {
        notFound();
    }

    return <ExplorePage source={exploreSource} type={explore} />;
}
