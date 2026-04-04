import { safeUnreachable } from '@dimensiondev/utils';
import { first } from 'lodash-es';

import { type SocialSource, Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { type WalletProfileInfo } from '@/providers/types/Firefly.js';

type FallbackInfoSource = Source.Firefly | Source.Wallet | SocialSource;
interface FallbackInfo {
    name?: string;
    avatar?: string;
    profileId?: string;
    handle?: string;
    source?: FallbackInfoSource;
}

export function extractFallbackInfo(
    fallback: WalletProfileInfo,
    // Priority aligned with iOS: Farcaster > Twitter > Lens > bSky > Account > Wallet
    sortedSources: FallbackInfoSource[] = [
        Source.Firefly,
        Source.Farcaster,
        Source.Twitter,
        Source.Lens,
        Source.Bsky,
        Source.Wallet,
    ],
): FallbackInfo {
    for (const source of sortedSources) {
        switch (source) {
            case Source.Firefly:
                if (!fallback.account) continue;
                return {
                    name: fallback.account.displayName,
                    avatar: fallback.account.avatar,
                    profileId: fallback.account.accountID,
                    source: Source.Firefly,
                };
            case Source.Farcaster:
                const farcasterProfile = first(fallback.farcasterProfiles);
                if (!farcasterProfile) continue;
                return {
                    name: farcasterProfile.display_name || farcasterProfile.username,
                    handle: farcasterProfile.username,
                    avatar: farcasterProfile.avatar?.url,
                    profileId: farcasterProfile.fid.toString(),
                    source: Source.Farcaster,
                };
            case Source.Twitter:
                const twitterProfile = first(fallback.twitterProfiles);
                if (!twitterProfile) continue;
                return {
                    name: twitterProfile.handle,
                    handle: twitterProfile.handle,
                    avatar: getStampAvatarByProfileId(Source.Twitter, twitterProfile.twitter_id),
                    profileId: twitterProfile.twitter_id,
                    source: Source.Twitter,
                };
            case Source.Lens:
                const lensV3Profile = first(fallback.lensProfilesV3);
                if (!lensV3Profile) continue;
                return {
                    name: lensV3Profile.localName || lensV3Profile.fullHandle,
                    handle: lensV3Profile.localName,
                    avatar: getStampAvatarByProfileId(Source.Lens, lensV3Profile.id),
                    profileId: lensV3Profile.id,
                    source: Source.Lens,
                };
            case Source.Bsky:
                const bskyProfile = first(fallback.bskyProfiles);
                if (!bskyProfile) continue;
                return {
                    name: bskyProfile.handle,
                    handle: bskyProfile.handle,
                    avatar: getStampAvatarByProfileId(Source.Bsky, bskyProfile.did),
                    profileId: bskyProfile.did,
                    source: Source.Bsky,
                };
            case Source.Wallet:
                const walletProfile = first(fallback.walletProfiles);
                if (!walletProfile) continue;
                return {
                    name: walletProfile.primary_ens || first(walletProfile.ens),
                    avatar: walletProfile.avatar,
                    profileId: walletProfile.address,
                    source: Source.Wallet,
                };
            default:
                safeUnreachable(source);
                continue;
        }
    }

    return { name: undefined, avatar: undefined };
}
