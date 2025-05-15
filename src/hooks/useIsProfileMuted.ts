'use client';

import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { QUERY_MUTE_PROFILE_SOURCES } from '@/constants/index.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useIsProfileMuted(source: Source, profileId: string, blocking?: boolean, enabled = true) {
    const isLogin = useIsLogin(narrowToSocialSource(source));
    const enabledQuery = !!source && !!profileId && isLogin && enabled;
    const enabledQueryProfile = QUERY_MUTE_PROFILE_SOURCES.includes(source);
    const { data: profileBlocking = false } = useQuery({
        queryKey: ['profile', source, profileId],
        queryFn() {
            return resolveSocialMediaProvider(source as SocialSource).getProfileById(profileId);
        },
        enabled: enabledQuery && enabledQueryProfile,
        select(profile) {
            return !!profile.viewerContext?.blocking;
        },
        staleTime: 600_000,
    });
    const { data = false } = useQuery({
        enabled: enabledQuery && !enabledQueryProfile,
        queryKey: ['profile-is-muted', source, profileId, enabledQueryProfile],
        staleTime: 600_000,
        queryFn: async () => {
            const platform = resolveFireflyPlatform(source);
            if (!platform) return undefined;
            if (enabledQueryProfile) return undefined;
            return FireflyEndpointProvider.isProfileMuted(platform, profileId);
        },
    });
    return data || !!blocking || profileBlocking;
}

export function isProfileMuted(profile: Profile) {
    const blocked = queryClient.getQueryData<boolean>(['profile-is-muted', profile.source, profile.profileId]);
    return blocked ?? profile.viewerContext?.blocking;
}
