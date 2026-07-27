import { SearchType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { SearchChannelContent } from '@/app/[locale]/(normal)/search/[...slug]/pages/SearchChannelContent.js';
import { SearchCommunityContent } from '@/app/[locale]/(normal)/search/[...slug]/pages/SearchCommunityContent.js';
import { SearchPostContent } from '@/app/[locale]/(normal)/search/[...slug]/pages/SearchPostContent.js';
import { SearchPredictionContent } from '@/app/[locale]/(normal)/search/[...slug]/pages/SearchPredictionContent.js';
import { SearchProfileContent } from '@/app/[locale]/(normal)/search/[...slug]/pages/SearchProfileContent.js';
import { SearchTokenContent } from '@/app/[locale]/(normal)/search/[...slug]/pages/SearchTokenContent.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

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
