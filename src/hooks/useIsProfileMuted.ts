'use client';

import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { QUERY_MUTE_PROFILE_SOURCES } from '@/constants/index.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useIsLogin, useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { isProfileMuted as isProfileMutedEndpoint } from '@/providers/firefly/endpoint/isProfileMuted.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useIsProfileMuted(source: Source, profileId: string, blocking?: boolean, enabled = true) {
    const isLoginFirefly = useIsLoginFirefly();
    const isLogin = useIsLogin(narrowToSocialSource(source));
    const myProfile = useCurrentProfile(narrowToSocialSource(source));

    const validParameters = !!source && !!profileId && enabled;
    const queryStatusFromFirefly = validParameters && !QUERY_MUTE_PROFILE_SOURCES.includes(source) && isLoginFirefly;
    const queryStatusFromSocial = validParameters && QUERY_MUTE_PROFILE_SOURCES.includes(source) && isLogin;

    const { data: profile } = useQuery({
        enabled: queryStatusFromSocial,
        queryKey: ['profile', source, profileId, myProfile?.profileId],
        staleTime: 600_000,
        queryFn() {
            return resolveSocialMediaProvider(source as SocialSource).getProfileById(profileId);
        },
    });
    const { data } = useQuery({
        enabled: queryStatusFromFirefly,
        queryKey: ['profile-is-muted', source, profileId, isLoginFirefly],
        staleTime: 600_000,
        queryFn: async () => {
            const platform = resolveFireflyPlatform(source);
            if (!platform) return undefined;
            return isProfileMutedEndpoint(platform, profileId);
        },
    });

    if (queryStatusFromFirefly) return data ?? false;
    if (queryStatusFromSocial) return profile?.viewerContext?.blocking ?? false;

    return blocking ?? false;
}

export function isProfileMuted(profile: Profile) {
    const blocked = queryClient.getQueryData<boolean>(['profile-is-muted', profile.source, profile.profileId]);
    return blocked ?? profile.viewerContext?.blocking;
}
