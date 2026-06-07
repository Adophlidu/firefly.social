import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';

export function createSiteMetadata(
    pathname: string,
    metadata?: { title?: string; description?: string } & Record<string, unknown>,
) {
    const title = metadata?.title ?? SITE_NAME;
    const description = metadata?.description ?? SITE_DESCRIPTION;

    return {
        metadataBase: new URL(SITE_URL),
        title,
        itunes: {
            appId: '1640183078',
        },
        description,
        openGraph: {
            title,
            description,
            siteName: SITE_NAME,
            url: urlcat(SITE_URL, pathname),
            images: [urlcat(SITE_URL, '/image/og.png')],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            creator: '@thefireflyapp',
            site: '@thefireflyapp',
            images: [urlcat(SITE_URL, '/image/og.png')],
        },
        manifest: '/site.webmanifest',
        icons: [
            {
                url: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                url: '/android-chrome-384x384.png',
                sizes: '384x384',
                type: 'image/png',
            },
            {
                rel: 'icon',
                url: '/favicon.ico',
            },
            {
                rel: 'apple-touch-icon',
                url: '/apple-touch-icon.png',
            },
        ],
        alternates: {
            canonical: urlcat(SITE_URL, pathname),
        },
        ...metadata,
    };
}
