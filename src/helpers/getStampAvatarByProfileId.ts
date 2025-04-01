import { safeUnreachable } from '@masknet/kit';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { FIREFLY_STAMP_URL, SITE_URL } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';

export function getStampAvatarByProfileId(source: Source, profileId: string) {
    switch (source) {
        case Source.Farcaster:
            return urlcat(FIREFLY_STAMP_URL, '/farcaster/:id', { id: profileId });
        case Source.Lens:
            return urlcat(FIREFLY_STAMP_URL, '/lens/:id', { id: profileId });
        case Source.Twitter:
            return bom.window
                ? urlcat('/api/twitter/user/:id/avatar', { id: profileId })
                : urlcat(SITE_URL, '/api/twitter/user/:id/avatar', { id: profileId });
        case Source.Bsky:
            return bom.window
                ? urlcat('/api/bsky/user/:id/avatar', { id: profileId })
                : urlcat(SITE_URL, '/api/bsky/user/:id/avatar', { id: profileId });
        case Source.Firefly:
            return urlcat(FIREFLY_STAMP_URL, '/firefly/:id', { id: profileId, s: 240 });
        case Source.Wallet:
        case Source.WalletMix:
        case Source.NFTs:
        case Source.Article:
        case Source.DAOs:
        case Source.Polymarket:
            return urlcat(FIREFLY_STAMP_URL, '/:address', { address: profileId });
        case Source.Telegram:
        case Source.Google:
        case Source.Apple:
        case Source.Posts:
        case Source.Notifications:
        case Source.Email:
        case Source.RocketsFun:
        case Source.Swap:
            return '';
        default:
            safeUnreachable(source);
            return '';
    }
}
