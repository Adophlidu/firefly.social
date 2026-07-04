import { Source } from '@dimensiondev/enums';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@dimensiondev/utils';
import type { UserV2, UserV2TimelineResult } from 'twitter-api-v2';

import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function convertTwitterAvatar(url: string) {
    return url.replace(/_normal.(jpe?g|png|gif|bmp)/, '_400x400.$1');
}

export function formatTwitterProfileStatus(statusList: UserV2['connection_status']): Profile['viewerContext'] {
    return statusList?.reduce((acc, status) => {
        switch (status) {
            case 'following':
                return { ...acc, following: true };
            case 'blocking':
            case 'muting':
                return { ...acc, blocking: true, fullBlocking: status === 'blocking' };
            case 'follow_request_sent':
                return { ...acc, followPending: true };
            default:
                return acc;
        }
    }, {});
}

export function formatTwitterProfile(data: UserV2): Profile {
    const bio = (data.entities?.description?.urls ?? []).reduce(
        (description, url) => description.replace(url.url, url.expanded_url),
        data.description ?? '',
    );
    const viewerContext = formatTwitterProfileStatus(data.connection_status);
    return {
        ...createDummyProfile(Source.Twitter),
        profileId: data.id,
        fullHandle: data.name,
        handle: data.username,
        displayName: data.name,
        pfp: convertTwitterAvatar(data.profile_image_url!),
        bio,
        bioContext: {
            mentions: data.entities?.description?.mentions?.map((x) => ({ id: x.username, source: Source.Twitter })),
        },
        followerCount: data.public_metrics?.followers_count ?? 0,
        followingCount: data.public_metrics?.following_count ?? 0,
        verified: data.verified || false,
        protected: data.protected || viewerContext?.followPending === true,
        viewerContext,
        website: data.url,
        location: data.location,
    };
}

export function formatTwitterProfilePage(
    data: UserV2TimelineResult,
    currentIndicator?: PageIndicator,
): Pageable<Profile, PageIndicator> {
    const profiles = data.data?.map(formatTwitterProfile) || [];
    return createPageable(
        profiles,
        createIndicator(currentIndicator),
        data.meta?.next_token ? createIndicator(undefined, data.meta.next_token) : undefined,
    );
}
