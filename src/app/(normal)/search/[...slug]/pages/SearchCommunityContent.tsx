'use client';

import { safeUnreachable } from '@masknet/kit';

import { SearchChannelContent } from '@/app/(normal)/search/[...slug]/pages/SearchChannelContent.js';
import { CommunityType } from '@/constants/enum.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function SearchCommunityContent() {
    const { communityType } = useSearchStateStore();

    switch (communityType) {
        case CommunityType.BskyFeed:
        case CommunityType.FarcasterChannel:
        case CommunityType.LensGroup:
            return <SearchChannelContent />;
        default:
            safeUnreachable(communityType);
            return null;
    }
}
