import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function createChannelMetadataFromChannel(
    channel: Channel,
    source: SocialSourceInURL,
    channelId: string,
    pathname: string,
): Metadata {
    const title = `View ${channel.name} on Firefly`;
    const description = `Join ${channel.name} on Firefly to connect, discuss and explore shared interests in Web3.`;

    return createSiteMetadata(pathname, {
        title,
        openGraph: {
            type: 'website',
            url: urlcat(SITE_URL, `/club/${source}/${channelId}/posts`),
            title,
            description,
            images: [{ url: channel.imageUrl }],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: [{ url: channel.imageUrl }],
        },
    });
}
