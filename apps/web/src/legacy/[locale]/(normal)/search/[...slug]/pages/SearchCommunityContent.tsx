'use client';

import { ClubType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { SearchChannelContent } from '@/legacy/[locale]/(normal)/search/[...slug]/pages/SearchChannelContent.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function SearchCommunityContent() {
    const { clubType } = useSearchStateStore();

    switch (clubType) {
        case ClubType.BskyFeed:
        case ClubType.FarcasterChannel:
        case ClubType.LensGroup:
            return <SearchChannelContent />;
        default:
            safeUnreachable(clubType);
            return null;
    }
}
