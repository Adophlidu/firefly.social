import { FIREFLY_STAMP_DEV_URL, FIREFLY_STAMP_URL } from '@dimensiondev/constants/static';
import { Source, STATUS } from '@dimensiondev/enums';
import { envs, SITE_URL } from '@dimensiondev/envs/web';
import { bom, safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { FireflyProfile, LensV3Profile, WalletProfile } from '@/providers/types/Firefly.js';

const STAMP_URL =
    envs.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled ? FIREFLY_STAMP_DEV_URL : FIREFLY_STAMP_URL;

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
        case Source.Tokens:
        case Source.Article:
        case Source.DAOs:
        case Source.Prediction:
        case Source.Polymarket:
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
        case Source.WorldCup:
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
