import type { AppBskyActorDefs } from '@atproto/api';

import { Source } from '@/constants/enum.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export function formatBskyProfile(profile: AppBskyActorDefs.ProfileViewDetailed): Profile {
    return {
        profileId: profile.did,
        source: Source.Bsky,
        profileSource: Source.Bsky,
        displayName: profile.displayName ?? profile.handle ?? '',
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
