'use client';

import { SearchChannelContent } from '@/app/(normal)/search/[...slug]/pages/SearchChannelContent.js';
import { ClubType } from '@/constants/enum.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
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
