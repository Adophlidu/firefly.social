import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { type WalletProfileInfo } from '@/providers/types/Firefly.js';

export function extractFallbackInfo(fallback: WalletProfileInfo): {
    name: string | undefined;
    avatar: string | undefined;
    source?: Source;
} {
    // Use Firefly account as fallback
    if (fallback.account) {
        return {
            name: fallback.account.displayName,
            avatar: fallback.account.avatar,
            source: Source.Firefly,
        };
    }

    const farcasterProfile = first(fallback.farcasterProfiles);
    if (farcasterProfile) {
        return {
            name: farcasterProfile.display_name || farcasterProfile.username,
            avatar: farcasterProfile.avatar?.url,
            source: Source.Farcaster,
        };
    }

    // Priority aligned with iOS: Farcaster > Twitter > Lens > bSky > Account > Wallet
    const twitterProfile = first(fallback.twitterProfiles);
    if (twitterProfile) {
        return {
            name: twitterProfile.handle,
            avatar: getStampAvatarByProfileId(Source.Twitter, twitterProfile.twitter_id),
            source: Source.Twitter,
        };
    }

    const lensV3Profile = first(fallback.lensProfilesV3);
    if (lensV3Profile) {
        return {
            name: lensV3Profile.localName || lensV3Profile.fullHandle,
            avatar: getStampAvatarByProfileId(Source.Lens, lensV3Profile.id),
            source: Source.Lens,
        };
    }

    const bskyProfile = first(fallback.bskyProfiles);
    if (bskyProfile) {
        return {
            name: bskyProfile.handle,
            avatar: getStampAvatarByProfileId(Source.Bsky, bskyProfile.did),
            source: Source.Bsky,
        };
    }

    const walletProfile = first(fallback.walletProfiles);
    if (walletProfile) {
        return { name: undefined, avatar: walletProfile.avatar, source: Source.Wallet };
    }

    return { name: undefined, avatar: undefined };
}
