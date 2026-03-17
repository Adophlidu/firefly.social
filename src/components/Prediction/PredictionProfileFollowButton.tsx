'use client';

import { memo, useCallback, useMemo } from 'react';
import type { Address } from 'viem';

import { FollowButton } from '@/components/Profile/FollowButton.js';
import { WatchButton } from '@/components/Profile/WatchButton.js';
import { type PredictionPlatform, Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isSocialSource } from '@/helpers/isSource.js';
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
    const profiles = useCurrentFireflyProfilesAll();
    const profilesAll = useCurrentProfilesAll();
    const isLoginFirefly = useIsLoginFirefly();
    const { source, profileId, name, isLoading } = usePredictionProfileData({ platform, address });

    const socialProfile = useMemo(() => {
        if (!profileId || !isSocialSource(source)) return null;

        return {
            ...createDummyProfile(source, source),
            profileId,
        };
    }, [source, profileId]);
    const isRelatedProfile = useMemo(() => {
        if (!profileId || (!isSocialSource(source) && source !== Source.Wallet)) return false;

        return profiles.some((x) => {
            return isSameFireflyIdentity(x.identity, { id: profileId, source });
        });
    }, [source, profileId, profiles]);

    const onBetProfileFollowButtonClick = useCallback(() => {
        if (!isLoginFirefly || (isSocialSource(source) && !profilesAll[source]?.profileId))
            return captureBetProfileFollowEvent(platform, 'login');
        if (isSocialSource(source) || source === Source.Wallet) return captureBetProfileFollowEvent(platform, source);
        return captureBetProfileFollowEvent(platform, 'proxy_wallet');
    }, [source, platform, isLoginFirefly, profilesAll]);

    if (isLoading || isRelatedProfile) return null;
    if (socialProfile) {
        return <FollowButton profile={socialProfile} onClick={onBetProfileFollowButtonClick} />;
    }
    return (
        <WatchButton
            address={(source === Source.Wallet && profileId ? profileId : address) as Address}
            ens={source === Source.Wallet ? name : undefined}
            onClick={onBetProfileFollowButtonClick}
        />
    );
});
