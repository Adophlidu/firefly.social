'use client';

import { type PropsWithChildren, use } from 'react';

import { SourceNav } from '@/components/SourceNav.js';
import { type ExploreSourceInURL, ExploreType, Source } from '@/constants/enum.js';
import { EXPLORE_SOURCES } from '@/constants/index.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveExploreSource } from '@/helpers/resolveSourceInUrl.js';
import { resolveExploreSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';

interface Props extends PropsWithChildren {
    params: Promise<{
        explore: ExploreType;
        source: ExploreSourceInURL;
    }>;
}

export default function Layout({ children, params }: Props) {
    const { explore, source } = use(params);
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
            {children}
        </>
    );
}
