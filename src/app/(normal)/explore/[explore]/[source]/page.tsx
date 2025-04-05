'use client';

import {use } from 'react';

import { ExplorePage } from '@/app/(normal)/explore/pages/Explore.js';
import { SourceNav } from '@/components/SourceNav.js';
import { type ExploreSource, type ExploreSourceInURL, ExploreType, Source,type TrendingType  } from '@/constants/enum.js';
import { EXPLORE_SOURCES } from '@/constants/index.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { resolveExploreSource } from '@/helpers/resolveSourceInUrl.js';
import { resolveExploreSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ source: ExploreSourceInURL; explore: ExploreType }> {}

export default function Page(props: Props) {
    const { source, explore } = use(props.params);
    const currentBskyProfile = useCurrentProfile(Source.Bsky);

    const sources = EXPLORE_SOURCES[explore];

    return (
        <>
            {sources ? (
                <SourceNav
                    source={resolveExploreSource(source)}
                    sources={
                        !currentBskyProfile && explore === ExploreType.TopProfiles
                            ? sources.filter((x) => x !== Source.Bsky)
                            : sources
                    }
                    urlResolver={(source) => resolveExploreUrl(explore, source)}
                    nameResolver={resolveExploreSourceName}
                />
            ) : null}
            <ExplorePage
                source={
                    explore === ExploreType.CryptoTrends
                        ? (source as TrendingType)
                        : (resolveSourceFromUrl(source) as ExploreSource)
                }
                type={explore}
            />
        </>
    );
}
