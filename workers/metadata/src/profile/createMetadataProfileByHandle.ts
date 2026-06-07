import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyProfile } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';
import { getProfileUrl } from '@/metadata/src/profile/getProfileUrl.js';

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

    const title = createPageTitleOG(`@${profile.handle}`);
    const description = `Follow @${profile.handle} to see their unified activity across X, Farcaster, Lens and Bluesky.`;

    return createSiteMetadata(pathname, {
        title,
        description,
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
