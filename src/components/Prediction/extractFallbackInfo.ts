import { first } from 'lodash-es';

import { type WalletProfileInfo } from '@/providers/types/Firefly.js';

export function extractFallbackInfo(fallback: WalletProfileInfo): {
    name: string | undefined;
    avatar: string | undefined;
} {
    // Use Firefly account as fallback
    if (fallback.account) {
        return {
            name: fallback.account.displayName,
            avatar: fallback.account.avatar,
        };
    }
    // Priority aligned with iOS: Farcaster > Twitter > Lens > bSky > Account > Wallet
    const twitterProfile = first(fallback.twitterProfiles);
    if (twitterProfile) {
        return { name: twitterProfile.handle, avatar: undefined };
    }

    const lensV3Profile = first(fallback.lensProfilesV3);
    if (lensV3Profile) {
        return {
            name: lensV3Profile.localName || lensV3Profile.fullHandle,
            avatar: undefined,
        };
    }

    const farcasterProfile = first(fallback.farcasterProfiles);
    if (farcasterProfile) {
        return {
            name: farcasterProfile.display_name || farcasterProfile.username,
            avatar: farcasterProfile.avatar?.url,
        };
    }

    const bskyProfile = first(fallback.bskyProfiles);
    if (bskyProfile) {
        return { name: bskyProfile.handle, avatar: undefined };
    }

    const walletProfile = first(fallback.walletProfiles);
    if (walletProfile) {
        return { name: undefined, avatar: walletProfile.avatar };
    }

    return { name: undefined, avatar: undefined };
}
