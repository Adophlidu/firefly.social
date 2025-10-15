'use client';
import { type HTMLProps, memo, useMemo } from 'react';

import { SourceNav } from '@/components/SourceNav/SourceNav.js';
import { type ExploreSourceInURL, ExploreType, Source } from '@/constants/enum.js';
import { EXPLORE_SOURCES } from '@/constants/index.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveExploreSource } from '@/helpers/resolveSourceInUrl.js';
import { resolveExploreSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';

interface Props extends HTMLProps<HTMLDivElement> {
    source: ExploreSourceInURL;
    explore: ExploreType;
}

export const ExploreSourceNav = memo<Props>(function ExploreSourceNav({ explore, source, ...rest }) {
    const currentBskyProfile = useCurrentProfile(Source.Bsky);
    const sources = useMemo(() => {
        const allSources = EXPLORE_SOURCES[explore];
        return explore === ExploreType.TopProfiles && !currentBskyProfile
            ? allSources?.filter((x) => x !== Source.Bsky)
            : allSources;
    }, [currentBskyProfile, explore]);

    if (!sources?.length) return null;

    return (
        <SourceNav
            source={resolveExploreSource(source)}
            sources={sources}
            urlResolver={(source) => resolveExploreUrl(explore, source)}
            nameResolver={resolveExploreSourceName}
            {...rest}
        />
    );
});
