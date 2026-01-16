import { bom, safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_STAMP_DEV_URL, FIREFLY_STAMP_URL, SITE_URL } from '@/constants/static.js';
import { type FireflyProfile, type LensV3Profile, type WalletProfile } from '@/providers/types/Firefly.js';

const STAMP_URL =
    env.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled ? FIREFLY_STAMP_DEV_URL : FIREFLY_STAMP_URL;

export function getStampAvatarByProfileId(source: Source, profileId: string, size = 240) {
    const s = Math.min(size, 500);
    switch (source) {
        case Source.Farcaster:
            return urlcat(STAMP_URL, '/farcaster/:id', { id: profileId, s });
        case Source.Lens:
            return urlcat(STAMP_URL, '/lens/:id', { id: profileId, s });
        case Source.Twitter:
            return bom.window
                ? urlcat('/api/twitter/user/:id/avatar', { id: profileId, s })
                : urlcat(SITE_URL, '/api/twitter/user/:id/avatar', { id: profileId, s });
        case Source.Bsky:
            return bom.window
                ? urlcat('/api/bsky/user/:id/avatar', { id: profileId, s })
                : urlcat(SITE_URL, '/api/bsky/user/:id/avatar', { id: profileId, s });
        case Source.Firefly:
            return urlcat(STAMP_URL, '/firefly/:id', { id: profileId, s });
        case Source.Wallet:
        case Source.WalletMix:
        case Source.NFTs:
        case Source.Tokens:
        case Source.Article:
        case Source.DAOs:
        case Source.Prediction:
            return urlcat(STAMP_URL, '/:address', { address: profileId, s });
        case Source.Telegram:
        case Source.Google:
        case Source.Apple:
        case Source.Posts:
        case Source.Notifications:
        case Source.Email:
        case Source.Swap:
        case Source.Transactions:
        case Source.Activities:
            return '';
        default:
            safeUnreachable(source);
            return '';
    }
}

export function getStampAvatarByFireflyProfile(profile: FireflyProfile) {
    if (profile.identity.source === Source.Lens)
        return getStampAvatarByProfileId(profile.identity.source, (profile.__origin__ as LensV3Profile).id);
    if (profile.identity.source === Source.Wallet) {
        const avatar = (profile.__origin__ as WalletProfile).avatar;
        if (avatar) return avatar;
    }
    return getStampAvatarByProfileId(profile.identity.source, profile.identity.id);
}
