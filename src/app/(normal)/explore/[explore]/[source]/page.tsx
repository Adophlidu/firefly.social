'use client';

import { use } from 'react';

import { ExplorePage } from '@/app/(normal)/explore/pages/Explore.js';
import { type ExploreSource, type ExploreSourceInURL, ExploreType, type TrendingType } from '@/constants/enum.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ source: ExploreSourceInURL; explore: ExploreType }> {}

export default function Page(props: Props) {
    const { source, explore } = use(props.params);

    return (
        <ExplorePage
            source={
                explore === ExploreType.CryptoTrends
                    ? (source as TrendingType)
                    : (resolveSourceFromUrl(source) as ExploreSource)
            }
            type={explore}
        />
    );
}
