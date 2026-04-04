/* cspell:disable */

import { Source } from '@/constants/enum.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export function formatBskyModeratorProfile(did: string): Profile | undefined {
    if (did === 'did:plc:ar7c4by46qjdydhdevvrndac') {
        return {
            source: Source.Bsky,
            profileSource: Source.Bsky,
            profileId: did,
            displayName: 'Bluesky Moderation Service',
            handle: 'moderation.bsky.app',
            fullHandle: 'moderation.bsky.app',
            bio: 'Official Bluesky moderation service. https://bsky.social/about/support/community-guidelines',
            pfp: '',
            followerCount: 0,
            followingCount: 0,
            status: ProfileStatus.Active,
            verified: true,
        } satisfies Profile;
    }
    return;
}
