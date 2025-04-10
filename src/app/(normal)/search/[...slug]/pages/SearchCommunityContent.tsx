'use client';

import { safeUnreachable } from '@masknet/kit';

import { SearchChannelContent } from '@/app/(normal)/search/[...slug]/pages/SearchChannelContent.js';
import { SearchGroupContent } from '@/app/(normal)/search/[...slug]/pages/SearchGroupContent.js';
import { CommunityType } from '@/constants/enum.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function SearchCommunityContent() {
    const { communityType } = useSearchStateStore();

    switch (communityType) {
        case CommunityType.BskyFeed:
        case CommunityType.FarcasterChannel:
        case CommunityType.LensFeed:
            return <SearchChannelContent />;
        case CommunityType.LensGroup:
            return <SearchGroupContent />;
        default:
            safeUnreachable(communityType);
            return null;
    }
}
