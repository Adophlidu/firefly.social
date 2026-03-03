import { skipToken, useQuery } from '@tanstack/react-query';

import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function useWatchProfileFollowStatus(profile: Profile, watching = false) {
    const isFollowing = !!profile.viewerContext?.following;
    const currentProfile = useCurrentProfile(profile.source);
    const { data } = useQuery<boolean>({
        queryKey: ['profile-follow-status', profile.source, profile.profileId, currentProfile?.profileId],
        queryFn: skipToken,
    });

    return watching ? (data ?? isFollowing) : isFollowing;
}
