'use client';

import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { queryMutedProfile } from '@/services/queryMutedProfiles.js';

export function useIsProfileMuted(source: Source, profileId: string, blocking?: boolean, enabled = true) {
    const isLoginFirefly = useIsLoginFirefly();
    const isLoginBsky = useIsLogin(Source.Bsky);

    const validParameters = !!source && !!profileId && enabled;
    const canQuery = validParameters && ((source === Source.Bsky && isLoginBsky) || isLoginFirefly);

    const { data } = useQuery({
        enabled: canQuery,
        queryKey: ['profile-is-muted', source, profileId],
        staleTime: 600_000,
        queryFn: () => queryMutedProfile(source, profileId),
    });

    return data ?? blocking ?? false;
}

export function isProfileMuted(profile: Profile) {
    const blocked = queryClient.getQueryData<boolean>(['profile-is-muted', profile.source, profile.profileId]);
    return blocked ?? profile.viewerContext?.blocking;
}
