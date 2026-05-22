import type { DefiUnitedTier } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { skipToken, useQuery } from '@tanstack/react-query';

import {
    type BadgeLevelPlatform,
    fetchDefiUnitedBadgeLevel,
} from '@/providers/firefly/worker/fetchDefiUnitedBadgeLevel.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const SOURCE_TO_PLATFORM: Partial<Record<Source, BadgeLevelPlatform>> = {
    [Source.Farcaster]: 'farcaster',
    [Source.Lens]: 'lens',
    [Source.Twitter]: 'twitter',
    [Source.Bsky]: 'bsky',
};

/**
 * Lookup DefiUnited donation tier by wallet address.
 */
export function useDefiUnitedBadge(address: string | null | undefined) {
    const valid = !!address && isValidAddressEthereum(address);
    return useQuery({
        queryKey: ['defiunited-badge', valid ? address!.toLowerCase() : undefined],
        queryFn: valid ? async () => fetchDefiUnitedBadgeLevel('eth', address!) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

/**
 * Lookup DefiUnited donation tier by social profile.
 * Backend resolves linked wallet addresses automatically.
 */
export function useDefiUnitedBadgeByProfile(profile: Profile | null | undefined) {
    return useQuery({
        queryKey: ['defiunited-badge-profile', profile?.source, profile?.profileId],
        queryFn: async (): Promise<DefiUnitedTier | null> => {
            if (!profile) return null;

            const platform = SOURCE_TO_PLATFORM[profile.source];
            if (!platform) return null;

            return fetchDefiUnitedBadgeLevel(platform, profile.profileId);
        },
        enabled: !!profile,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
