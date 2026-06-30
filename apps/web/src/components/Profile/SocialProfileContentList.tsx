'use client';

import type { SocialSource } from '@dimensiondev/enums';
import { SocialProfileCategory, Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { memo, type ReactNode } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { ChannelList } from '@/components/Profile/ChannelList.js';
import { CollectedList } from '@/components/Profile/CollectedList.js';
import { FeedList } from '@/components/Profile/FeedList.js';
import { LikedFeedList } from '@/components/Profile/LikedFeedList.js';
import { MediaList } from '@/components/Profile/MediaList.js';
import { RepliesList } from '@/components/Profile/RepliesList.js';
import { TrumpTruthSocialPosts } from '@/components/TrumpTruthSocial/TrumpTruthSocialPosts.js';
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

    // Feed is the canonical, viewer-independent timeline. Its first page is prefetched
    // in the profile layout, so render it server-side (no NoSSR, no viewer-sync gate) to
    // ship real posts in the initial HTML. The viewer-relationship overlay (hasLiked, …)
    // is filled in client-side once the authenticated query refetches.
    if (type === SocialProfileCategory.Feed) {
        // Twitter timelines need the viewer's token (no anonymous prefetch in the layout),
        // so keep them client-only to avoid a session-dependent SSR/hydration divergence.
        if (source === Source.Twitter) {
            return (
                <NoSSR>
                    <FeedList source={source} profileId={profileId} />
                </NoSSR>
            );
        }
        return <FeedList source={source} profileId={profileId} />;
    }

    if (isSyncing) return <Loading />;

    // Other tabs stay client-only (auth-gated and/or not prefetched). NoSSR preserves
    // their previous behaviour now that the layout no longer wraps the whole subtree.
    let content: ReactNode;
    switch (type) {
        case SocialProfileCategory.Collected:
            content = <CollectedList source={source} profileId={profileId} />;
            break;
        case SocialProfileCategory.Channels:
            content = <ChannelList source={source} profileId={profileId} />;
            break;
        case SocialProfileCategory.Replies:
            content = <RepliesList source={source} profileId={profileId} />;
            break;
        case SocialProfileCategory.Likes:
            content = <LikedFeedList source={source} profileId={profileId} />;
            break;
        case SocialProfileCategory.Media:
            content = <MediaList source={source} profileId={profileId} />;
            break;
        case SocialProfileCategory.TruthSocial:
            content = <TrumpTruthSocialPosts />;
            break;
        default:
            safeUnreachable(type);
            content = null;
    }

    return <NoSSR>{content}</NoSSR>;
});
