import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { skipToken, useQuery } from '@tanstack/react-query';
import urlcat from 'urlcat';

import type { DefiUnitedTier } from '@/constants/enum.js';
import { Source } from '@/constants/enum.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

type BadgeLevelPlatform = 'eth' | 'twitter' | 'lens' | 'farcaster' | 'account' | 'bsky';

interface BadgeLevelResponse {
    level: number;
    platform: string;
    profile_id: string;
}

const SOURCE_TO_PLATFORM: Partial<Record<Source, BadgeLevelPlatform>> = {
    [Source.Farcaster]: 'farcaster',
    [Source.Lens]: 'lens',
    [Source.Twitter]: 'twitter',
    [Source.Bsky]: 'bsky',
};

async function fetchBadgeLevel(platform: BadgeLevelPlatform, id: string): Promise<DefiUnitedTier | null> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/unifi/badge-level', { platform, id });
    const res = await fetchJson<{ data: BadgeLevelResponse }>(url);
    return res.data.level ?? null;
}

/**
 * Lookup DefiUnited donation tier by wallet address.
 */
export function useDefiUnitedBadge(address: string | null | undefined) {
    const valid = !!address && isValidAddressEthereum(address);
    return useQuery({
        queryKey: ['defiunited-badge', valid ? address!.toLowerCase() : undefined],
        queryFn: valid ? async () => fetchBadgeLevel('eth', address) : skipToken,
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

            return fetchBadgeLevel(platform, profile.profileId);
        },
        enabled: !!profile,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
