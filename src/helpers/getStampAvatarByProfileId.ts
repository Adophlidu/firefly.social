import { safeUnreachable } from '@masknet/kit';
import urlcat from 'urlcat';

import { Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_STAMP_DEV_URL, FIREFLY_STAMP_URL, SITE_URL } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';
import type { FireflyProfile, LensV3Profile, WalletProfile } from '@/providers/types/Firefly.js';

const STAMP_URL =
    env.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled ? FIREFLY_STAMP_DEV_URL : FIREFLY_STAMP_URL;

export function getStampAvatarByProfileId(source: Source, profileId: string, size?: number) {
    switch (source) {
        case Source.Farcaster:
            return urlcat(STAMP_URL, '/farcaster/:id', { id: profileId, size });
        case Source.Lens:
            return urlcat(STAMP_URL, '/lens/:id', { id: profileId, size });
        case Source.Twitter:
            return bom.window
                ? urlcat('/api/twitter/user/:id/avatar', { id: profileId, size })
                : urlcat(SITE_URL, '/api/twitter/user/:id/avatar', { id: profileId, size });
        case Source.Bsky:
            return bom.window
                ? urlcat('/api/bsky/user/:id/avatar', { id: profileId, size })
                : urlcat(SITE_URL, '/api/bsky/user/:id/avatar', { id: profileId, size });
        case Source.Firefly:
            return urlcat(STAMP_URL, '/firefly/:id', { id: profileId, s: size ?? 240 });
        case Source.Wallet:
        case Source.WalletMix:
        case Source.NFTs:
        case Source.Article:
        case Source.DAOs:
        case Source.Polymarket:
            return urlcat(STAMP_URL, '/:address', { address: profileId, size });
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
