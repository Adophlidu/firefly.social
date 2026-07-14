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
                // Route identity stays highest so the active tab always matches
                // the URL handle (FW-7649).
                if (isSameFireflyIdentity(profile.identity, identity)) return 5;
                // The explicitly-set primary account must outrank the merely-logged-in
                // account, otherwise "Set as primary" has no effect on the profile
                // source tab (FW-7908).
                if (source !== Source.Wallet && profile?.isDefault) return 4;
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
