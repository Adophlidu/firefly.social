'use client';

import { memo, useMemo } from 'react';

import { SourceNav } from '@/components/SourceNav.js';
import { SearchType, Source } from '@/constants/enum.js';
import {
    REQUIRE_LOGIN_SOURCES_IN_SEARCH,
    SORTED_SEARCH_TYPE,
    SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES,
    SORTED_SOCIAL_SOURCES,
} from '@/constants/index.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSearchKeyword } from '@/helpers/resolveSearchKeyword.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

interface SearchSourcesProps {
    query: string;
    source: Source;
    searchType: SearchType;
}

export const SearchSources = memo<SearchSourcesProps>(function SearchSources({
    query,
    source: selectedSource,
    searchType,
}) {
    const profileAll = useCurrentProfilesAll();

    const sources = useMemo(() => {
        if (SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES.includes(selectedSource)) {
            const { handle } = resolveSearchKeyword(query);
            if (handle) return SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES;
        }
        return SORTED_SOCIAL_SOURCES.filter((x) => {
            if (REQUIRE_LOGIN_SOURCES_IN_SEARCH.includes(x) && !profileAll[x]?.profileId) return false;

            const supportTypes = SORTED_SEARCH_TYPE[narrowToSocialSource(x)];
            if (!supportTypes.includes(searchType)) return false;

            return true;
        });
    }, [query, profileAll, searchType, selectedSource]);

    return (
        <SourceNav
            source={selectedSource}
            sources={sources}
            urlResolver={(x) => resolveSearchUrl(query, searchType, x)}
            nameResolver={(x) => resolveSourceName(x)}
            className="flex gap-x-2 px-4"
        />
    );
});
