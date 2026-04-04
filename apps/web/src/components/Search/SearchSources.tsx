'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, useMemo } from 'react';

import { SourceNav } from '@/components/SourceNav/SourceNav.js';
import {
    SORTED_SEARCH_TYPE,
    SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES,
    SORTED_SOCIAL_SOURCES,
} from '@/constants/computed.js';
import { SearchType } from '@/constants/enum.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSearchKeyword } from '@/helpers/resolveSearchKeyword.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export const SearchSources = memo(function SearchSources({ className }: { className?: string }) {
    const { searchKeyword, searchType, source: selectedSource } = useSearchStateStore();

    const sources = useMemo(() => {
        if (SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES.includes(selectedSource)) {
            const { handle } = resolveSearchKeyword(searchKeyword);
            if (handle) return SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES;
        }
        return SORTED_SOCIAL_SOURCES.filter((x) => {
            const supportTypes = SORTED_SEARCH_TYPE[narrowToSocialSource(x)];
            if (!supportTypes.includes(searchType)) return false;

            return true;
        });
    }, [searchKeyword, searchType, selectedSource]);

    if (searchType !== SearchType.Posts) return null;

    return (
        <SourceNav
            source={selectedSource}
            sources={sources}
            urlResolver={(x) => resolveSearchUrl(searchKeyword, searchType, x)}
            nameResolver={(x) => resolveSourceName(x)}
            className={classNames('flex gap-x-2 px-4', className)}
        />
    );
});
