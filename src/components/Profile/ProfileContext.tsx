'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useMemo } from 'react';

import { Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { type FireflyIdentity, type FireflyProfile } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

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

export function ProfileContextProvider({ children, ...value }: PropsWithChildren<ProfileContextProviderProps>) {
    const { socialProfile } = value;
    const source = socialProfile?.source || Source.Farcaster;
    const isSyncing = useAsyncStatus(source);
    const currentProfile = useCurrentProfile(source);
    const { data: refreshedProfile, isLoading } = useQuery({
        enabled: !!socialProfile && !isSyncing,
        staleTime: 1000 * 60, // 1 minute
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        queryKey: ['profile', socialProfile?.source, socialProfile?.profileId, currentProfile?.profileId, 'refreshed'],
        queryFn: !socialProfile
            ? skipToken
            : () => resolveSocialMediaProvider(socialProfile.source).getProfileById(socialProfile.profileId, true),
    });

    const cachedValue = useMemo(
        () => ({
            ...value,
            isRefreshing: isLoading || isSyncing,
            refreshedSocialProfile: refreshedProfile || socialProfile,
        }),
        [refreshedProfile, value, socialProfile, isLoading, isSyncing],
    );

    return <ProfileContext.Provider value={cachedValue}>{children}</ProfileContext.Provider>;
}
