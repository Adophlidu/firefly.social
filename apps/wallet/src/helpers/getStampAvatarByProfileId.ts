import { Source, STATUS } from '@dimensiondev/enums';
import { bom, safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { FIREFLY_STAMP_DEV_URL, FIREFLY_STAMP_URL } from '@/constants/static.js';

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
                : urlcat(env.external.NEXT_PUBLIC_SITE_URL, '/api/twitter/user/:id/avatar', { id: profileId, s });
        case Source.Bsky:
            return bom.window
                ? urlcat('/api/bsky/user/:id/avatar', { id: profileId, s })
                : urlcat(env.external.NEXT_PUBLIC_SITE_URL, '/api/bsky/user/:id/avatar', { id: profileId, s });
        case Source.Firefly:
            return urlcat(STAMP_URL, '/firefly/:id', { id: profileId, s });
        case Source.Wallet:
        case Source.WalletMix:
        case Source.NFTs:
        case Source.Tokens:
        case Source.Article:
        case Source.DAOs:
        case Source.Polymarket:
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
