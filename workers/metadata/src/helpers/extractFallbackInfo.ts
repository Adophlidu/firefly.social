import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { formatAddress } from '@dimensiondev/workers-shared/helpers/formatAddress.js';

import type { WalletProfiles } from '@/metadata/src/firefly-profile/types.js';

/**
 * Extract display name from social profiles with priority:
 * Farcaster > Lens > Twitter > ENS > formatted address
 */
export function extractFallbackInfo(profiles: WalletProfiles | null | undefined, walletAddress: string) {
    if (!profiles) {
        return {
            displayName: formatAddress(walletAddress, 4),
        };
    }

    const farcasterProfile = first(profiles.farcasterProfiles);
    const lensProfile = first(profiles.lensProfilesV3);
    const twitterProfile = first(profiles.twitterProfiles);
    const walletProfile = first(profiles.walletProfiles);

    let displayName = formatAddress(walletAddress, 4);

    if (farcasterProfile?.display_name) {
        displayName = farcasterProfile.display_name;
    } else if (lensProfile?.fullHandle) {
        displayName = lensProfile.fullHandle;
    } else if (twitterProfile?.handle) {
        displayName = `@${twitterProfile.handle}`;
    } else if (walletProfile?.primary_ens) {
        displayName = walletProfile.primary_ens;
    }

    return {
        displayName,
    };
}
