'use client';

import { Source } from '@dimensiondev/enums';
import { skipToken, useQuery } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useMemo } from 'react';

import { STALE_TIMES } from '@/constants/query.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileContextProviderProps {
    profiles: FireflyProfile[];
    identity?: FireflyIdentity;
    socialProfile: Profile | null;
}

export const ProfileContext = createContext<
    Omit<ProfileContextProviderProps, 'socialProfile'> & {
        refreshedSocialProfile: Profile | null;
        isRefreshing: boolean;
    }
>({
    profiles: [],
    isRefreshing: false,
    refreshedSocialProfile: null,
});

export function ProfileContextProvider({
    children,
    identity,
    profiles,
    socialProfile,
}: PropsWithChildren<ProfileContextProviderProps>) {
    const source = socialProfile?.source || Source.Farcaster;
    const isSyncing = useAsyncStatus(source);
    const currentProfile = useCurrentProfile(source);

    const enabled = !!socialProfile && !isSyncing;
    const { data: refreshedProfile, isLoading } = useQuery({
        enabled,
        staleTime: STALE_TIMES.MINUTE_1,

        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        queryKey: ['profile', socialProfile?.source, socialProfile?.profileId, currentProfile?.profileId, 'refreshed'],
        queryFn: !enabled
            ? skipToken
            : () => resolveSocialMediaProvider(socialProfile.source).getProfileById(socialProfile.profileId, true),
    });

    const cachedValue = useMemo(
        () => ({
            identity,
            profiles,
            socialProfile,
            isRefreshing: isLoading || isSyncing,
            refreshedSocialProfile: refreshedProfile || socialProfile,
        }),
        [identity, profiles, socialProfile, isLoading, isSyncing, refreshedProfile],
    );

    return <ProfileContext.Provider value={cachedValue}>{children}</ProfileContext.Provider>;
}
