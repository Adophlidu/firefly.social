import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';
import urlcat from 'urlcat';

export enum ReferralAccountPlatform {
    X = 'x',
    Farcaster = 'f',
    Lens = 'l',
    Bsky = 'b',
}

function resolveActivityUrl(
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
