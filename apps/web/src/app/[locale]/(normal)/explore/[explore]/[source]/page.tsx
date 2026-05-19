'use client';

import { EXPLORE_SOURCES } from '@dimensiondev/constants/computed';
import { type ExploreSource, type ExploreSourceInURL, ExploreType, type TrendingType } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { use } from 'react';

import { ExplorePage } from '@/app/[locale]/(normal)/explore/pages/Explore.js';
import { notFound } from '@/esm/navigation.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';

interface Props extends LayoutProps<{ source: string; explore: ExploreType }> {}

export default function Page(props: Props) {
    const { source, explore } = use(props.params);

    if (explore === ExploreType.Prediction) {
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
