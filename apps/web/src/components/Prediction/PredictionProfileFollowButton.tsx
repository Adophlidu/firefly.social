'use client';

import type { PredictionPlatform, SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo } from 'react';
import type { Address } from 'viem';

import { FollowButton } from '@/components/Profile/FollowButton.js';
import { WatchButton } from '@/components/Profile/WatchButton.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { usePredictionProfileData } from '@/hooks/prediction/usePredictionProfileData.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { captureBetProfileFollowEvent } from '@/providers/telemetry/captureBetProfileFollowEvent.js';

interface Props {
    address: string;
    platform: PredictionPlatform;
}

export const PredictionProfileFollowButton = memo<Props>(function PredictionProfileFollowButton({ address, platform }) {
    const isLogin = useIsLoginFirefly();
    const profiles = useCurrentFireflyProfilesAll();
    const profilesAll = useCurrentProfilesAll();
    const { source, profileId, name, isLoading } = usePredictionProfileData({ platform, address });

    const { data, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile', source, profileId, profilesAll[source as SocialSource]?.profileId],
        enabled: !!profileId && isSocialSource(source) && !!profilesAll[source]?.profileId,
        queryFn: async () => {
            if (!isSocialSource(source) || !profileId) return null;
            return resolveSocialMediaProvider(source).getProfileById(profileId);
        },
    });

    const socialProfile = useMemo(() => {
        if (!profileId || !isSocialSource(source)) return null;
        if (data) return data;

        return {
            ...createDummyProfile(source, source),
            profileId,
        };
    }, [source, profileId, data]);
    const isRelatedProfile = useMemo(() => {
        if (!profileId || (!isSocialSource(source) && source !== Source.Wallet)) return false;

        return profiles.some((x) => {
            return isSameFireflyIdentity(x.identity, { id: profileId, source });
        });
    }, [source, profileId, profiles]);

    const onBetProfileFollowButtonClick = useCallback(() => {
        if (!isLogin || (isSocialSource(source) && !profilesAll[source]?.profileId))
            return captureBetProfileFollowEvent(platform, 'login');
        if (isSocialSource(source) || source === Source.Wallet) return captureBetProfileFollowEvent(platform, source);
        return captureBetProfileFollowEvent(platform, 'proxy_wallet');
    }, [source, platform, isLogin, profilesAll]);

    if (isLoading || isRelatedProfile || isProfileLoading) return null;
    if (socialProfile) {
        return <FollowButton profile={socialProfile} onClick={onBetProfileFollowButtonClick} />;
    }

    const walletAddress = source === Source.Wallet && profileId ? profileId : undefined;
    if (!walletAddress) return null;

    return (
        <WatchButton
            address={walletAddress as Address}
            ens={source === Source.Wallet ? name : undefined}
            onClick={onBetProfileFollowButtonClick}
        />
    );
});
