import type { SocialSourceInURL } from '@dimensiondev/enums';
import { FIREFLY_SOCIAL_ROOT_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyChannel } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';

export async function createMetadataChannelById(
    source: SocialSourceInURL,
    channelId: string,
    pathname: string,
    c: Context,
) {
    const channel = await fetchFireflyRpc<FireflyChannel | null>(source, 'getChannelById', { channelId }, c).catch(
        () => null,
    );
    if (!channel) return createSiteMetadata(pathname);

    const images = [
        {
            url: channel.imageUrl,
        },
    ];

    const title = createPageTitleOG(channel.name);
    const description = `Join ${channel.name} on Firefly to connect, discuss and explore shared interests in Web3.`;

    return createSiteMetadata(pathname, {
        title,
        openGraph: {
            type: 'website',
            url: urlcat(FIREFLY_SOCIAL_ROOT_URL, `/club/${source}/${channelId}/posts`),
            title,
            description,
            images,
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images,
        },
    });
}
