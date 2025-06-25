import type { SocialSourceInURL } from '@/constants/enum.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';

export async function createMetadataChannelById(pathname: string, source: SocialSourceInURL, channelId: string) {
    if (!isSocialSourceInUrl(source)) return createSiteMetadata(pathname);

    const socialSource = resolveSocialSource(source);
    const provider = resolveSocialMediaProvider(socialSource);
    const channel = await provider.getChannelById(channelId);
    if (!channel) return createSiteMetadata(pathname);

    const images = [
        {
            url: channel.imageUrl,
        },
    ];

    const title = createPageTitleOG(channel.name);
    const description = channel.description ?? '';

    return createSiteMetadata(pathname, {
        title,
        openGraph: {
            type: 'website',
            url: resolveChannelUrl(channel.id, socialSource),
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
