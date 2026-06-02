import type { ProfilePageSource, SocialSource } from '@dimensiondev/enums';
import { Source, WalletProfileDataSource } from '@dimensiondev/enums';
import { useCallback } from 'react';

import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

export function useSortFireflyProfiles() {
    const profileAll = useCurrentProfilesAll();

    return useCallback(
        (source: ProfilePageSource, identity: FireflyIdentity, a: FireflyProfile, b: FireflyProfile) => {
            const getSortLevel = (profile: FireflyProfile) => {
                // Keep URL identity at the highest priority so the selected tab
                // always matches the profile currently shown in the route.
                if (isSameFireflyIdentity(profile.identity, identity)) return 5;
                if (profileAll?.[source as SocialSource]?.profileId === profile.identity.id) return 4;
                if (source !== Source.Wallet && profile?.isDefault) return 3;
                if (profile?.isDefault) return 2;
                if ((profile?.__origin__ as WalletProfile)?.dataSource === WalletProfileDataSource.Privy) return 1;
                return 0;
            };
            return getSortLevel(b) - getSortLevel(a);
        },
        [profileAll],
    );
}
