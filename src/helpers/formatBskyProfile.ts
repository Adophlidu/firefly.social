import type { AppBskyActorDefs } from '@atproto/api';
import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

function getDisplayNameFromHandle(handle: string) {
    // requirements:
    // 1. doesn't begin or end with a hyphen
    // 2. at least 3 characters
    // 3. only contains letters, numbers, and hyphens
    const matched = handle.match(/^(?!-)[A-Za-z0-9-]{3,}(?<!-)/) ?? [];
    return first(matched) ?? handle;
}

export function formatBskyProfile(profile: AppBskyActorDefs.ProfileViewDetailed): Profile {
    return {
        profileId: profile.did,
        source: Source.Bsky,
        profileSource: Source.Bsky,
        displayName: profile.displayName || getDisplayNameFromHandle(profile.handle),
        bio: profile.description ?? '',
        handle: profile.handle,
        fullHandle: profile.handle,
        pfp: profile.avatar ?? '',
        followerCount: profile.followersCount ?? 0,
        followingCount: profile.followsCount ?? 0,
        status: (profile.active ?? true) ? ProfileStatus.Active : ProfileStatus.Inactive,
        verified: true,
        viewerContext: {
            following: !!profile.viewer?.following,
            followedBy: !!profile.viewer?.followedBy,
            blocking: profile.viewer?.blockedBy,
        },
    };
}
