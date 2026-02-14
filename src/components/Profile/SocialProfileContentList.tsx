'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { Loading } from '@/components/Loading.js';
import { ChannelList } from '@/components/Profile/ChannelList.js';
import { CollectedList } from '@/components/Profile/CollectedList.js';
import { FeedList } from '@/components/Profile/FeedList.js';
import { LikedFeedList } from '@/components/Profile/LikedFeedList.js';
import { MediaList } from '@/components/Profile/MediaList.js';
import { RepliesList } from '@/components/Profile/RepliesList.js';
import { TrumpTruthSocialPosts } from '@/components/TrumpTruthSocial/TrumpTruthSocialPosts.js';
import { SocialProfileCategory, type SocialSource } from '@/constants/enum.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';

export const SocialProfileContentList = memo(function SocialProfileContentList({
    type,
    source,
    profileId,
}: {
    type: SocialProfileCategory;
    source: SocialSource;
    profileId: string;
}) {
    const isSyncing = useAsyncStatus(source);
    if (isSyncing) return <Loading />;

    switch (type) {
        case SocialProfileCategory.Feed:
            return <FeedList source={source} profileId={profileId} />;
        case SocialProfileCategory.Collected:
            return <CollectedList source={source} profileId={profileId} />;
        case SocialProfileCategory.Channels:
            return <ChannelList source={source} profileId={profileId} />;
        case SocialProfileCategory.Replies:
            return <RepliesList source={source} profileId={profileId} />;
        case SocialProfileCategory.Likes:
            return <LikedFeedList source={source} profileId={profileId} />;
        case SocialProfileCategory.Media:
            return <MediaList source={source} profileId={profileId} />;
        case SocialProfileCategory.TruthSocial:
            return <TrumpTruthSocialPosts />;
        default:
            safeUnreachable(type);
            return null;
    }
});
