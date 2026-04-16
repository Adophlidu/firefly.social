import { useCallback } from 'react';

import { type ProfilePageSource, type SocialSource, Source } from '@/constants/enum.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import {
    type FireflyIdentity,
    type FireflyProfile,
    type WalletProfile,
    WalletProfileDataSource,
} from '@/providers/types/Firefly.js';

export function useSortFireflyProfiles() {
    const profileAll = useCurrentProfilesAll();

    return useCallback(
        (source: ProfilePageSource, identity: FireflyIdentity, a: FireflyProfile, b: FireflyProfile) => {
            const getSortLevel = (profile: FireflyProfile) => {
                if (source !== Source.Wallet && profile?.isDefault) return 5;
                if (isSameFireflyIdentity(profile.identity, identity)) return 4;
                if (profileAll?.[source as SocialSource]?.profileId === profile.identity.id) return 3;
                if (profile?.isDefault) return 2;
                if ((profile?.__origin__ as WalletProfile)?.dataSource === WalletProfileDataSource.Privy) return 1;
                return 0;
            };
            return getSortLevel(b) - getSortLevel(a);
        },
        [profileAll],
    );
}
