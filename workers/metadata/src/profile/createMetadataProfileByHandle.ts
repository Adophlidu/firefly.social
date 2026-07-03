import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyProfile } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';
import { getProfileUrl } from '@/metadata/src/profile/getProfileUrl.js';

const MAX_DESCRIPTION_LENGTH = 300;

function formatFollowerCount(count: number) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(count);
}

export async function createMetadataProfileByHandle(
    source: SocialSourceInURL,
    pathname: string,
    handle: string,
    context: Context,
) {
    const profile = await fetchFireflyRpc<FireflyProfile | null>(
        source,
        'getProfileByHandle',
        { handle },
        context,
    ).catch(() => null);
    if (!profile) return createSiteMetadata(pathname);

    const images = [
        {
            url: urlcat(SITE_URL, `/api/og/profile/${source}/${handle}/image`),
        },
    ];

    // remote RPC data may omit fields even though the type claims they are present
    const displayName = profile.displayName?.trim();
    const bio = profile.bio?.trim();
    const followers = Number.isFinite(profile.followerCount)
        ? `${formatFollowerCount(profile.followerCount)} followers`
        : null;
    const nameOnFirefly = displayName
        ? `${displayName} (@${profile.handle}) on Firefly`
        : `@${profile.handle} on Firefly`;

    const title = displayName ? nameOnFirefly : createPageTitleOG(`@${profile.handle}`);
    // truncate by code point to avoid splitting a surrogate pair at the boundary
    const description = Array.from([nameOnFirefly, followers, bio].filter(Boolean).join(' · '))
        .slice(0, MAX_DESCRIPTION_LENGTH)
        .join('');

    return createSiteMetadata(pathname, {
        title,
        description,
        alternates: {
            canonical: urlcat(SITE_URL, getProfileUrl(profile)),
        },
        openGraph: {
            type: 'profile',
            url: urlcat(SITE_URL, getProfileUrl(profile)),
            title,
            description,
            images,
            username: profile.handle,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
