'use client';

import { use } from 'react';

import { ExplorePage } from '@/app/(normal)/explore/pages/Explore.js';
import { type ExploreSource, ExploreType, type SourceInURL, type TrendingType } from '@/constants/enum.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ source: SourceInURL | TrendingType; explore: ExploreType }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    return (
        <ExplorePage
            source={
                params.explore === ExploreType.CryptoTrends
                    ? (params.source as TrendingType)
                    : (resolveSourceFromUrl(params.source) as ExploreSource)
            }
            type={params.explore}
        />
    );
}
