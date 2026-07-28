import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
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
    const ogImageUrl = urlcat(SITE_URL, '/api/og/channel/:source/:id/image', {
        source,
        id: channelId,
    });

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'website',
            url: urlcat(SITE_URL, `/club/${source}/${channelId}/posts`),
            title,
            description,
            images: [ogImageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
    });
}
