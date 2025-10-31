import { createLookupTableResolver } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { SITE_URL } from '@/constants/index.js';

export enum ReferralAccountPlatform {
    X = 'x',
    Farcaster = 'f',
    Lens = 'l',
    Bsky = 'b',
}

export function resolveActivityUrl(
    name: string,
    options?: {
        platform?: ReferralAccountPlatform;
        referralCode?: string;
    },
) {
    return urlcat('/event/:name', {
        name,
        p: options?.platform,
        r: options?.referralCode,
    });
}

const resolveReferralAccountPlatformFromSocialSource = createLookupTableResolver<SocialSource, ReferralAccountPlatform>(
    {
        [Source.Twitter]: ReferralAccountPlatform.X,
        [Source.Farcaster]: ReferralAccountPlatform.Farcaster,
        [Source.Lens]: ReferralAccountPlatform.Lens,
        [Source.Bsky]: ReferralAccountPlatform.Bsky,
    },
    (source) => {
        throw new UnreachableError('social source', source);
    },
);

export function resolveActivityShareUrl(name: string, source: SocialSource, handle?: string) {
    return urlcat(
        SITE_URL,
        resolveActivityUrl(name, {
            referralCode: handle,
            platform: resolveReferralAccountPlatformFromSocialSource(source),
        }),
    );
}
