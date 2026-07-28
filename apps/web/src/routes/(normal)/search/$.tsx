/* eslint-disable react-hooks/rules-of-hooks -- slot exports are components, but named after the slot (lowercase) they fill */
import { SearchType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { SearchPredictionFilterSidebar } from '@/components/Search/SearchPredictionFilterSidebar.js';
import { SearchChannelContent } from '@/legacy/[locale]/(normal)/search/[...slug]/pages/SearchChannelContent.js';
import { SearchCommunityContent } from '@/legacy/[locale]/(normal)/search/[...slug]/pages/SearchCommunityContent.js';
import { SearchPostContent } from '@/legacy/[locale]/(normal)/search/[...slug]/pages/SearchPostContent.js';
import { SearchPredictionContent } from '@/legacy/[locale]/(normal)/search/[...slug]/pages/SearchPredictionContent.js';
import { SearchProfileContent } from '@/legacy/[locale]/(normal)/search/[...slug]/pages/SearchProfileContent.js';
import { SearchTokenContent } from '@/legacy/[locale]/(normal)/search/[...slug]/pages/SearchTokenContent.js';
import { useSearchStateStore, useSearchStateStore as useSearchStateStoreForSidebar } from '@/store/useSearchStore.js';

/** Prediction searches get the filter sidebar (the old exact-path rule,
    expressed against the search-type store the page already uses). */
export function sidebar() {
    const { searchType } = useSearchStateStoreForSidebar();
    return searchType === SearchType.Prediction ? <SearchPredictionFilterSidebar /> : <DefaultRightSidebarContent />;
}

export default function SearchPage() {
    const { searchType } = useSearchStateStore();

    switch (searchType) {
        case SearchType.Profiles:
            return <SearchProfileContent />;
        case SearchType.Posts:
            return <SearchPostContent />;
        case SearchType.Channels:
            return <SearchChannelContent />;
        case SearchType.Tokens:
            return <SearchTokenContent />;
        case SearchType.Clubs:
            return <SearchCommunityContent />;
        case SearchType.Prediction:
            return <SearchPredictionContent />;
        default:
            safeUnreachable(searchType);
            return null;
    }
}
