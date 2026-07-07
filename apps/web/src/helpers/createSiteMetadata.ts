import { SITE_DESCRIPTION, SITE_NAME, SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import { FileMimeType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

export function createSiteMetadata(pathname: string, metadata?: Partial<Metadata>) {
    const title = metadata?.title ?? SITE_NAME;
    const description = metadata?.description ?? SITE_DESCRIPTION;
    const { openGraph, twitter, ...restMetadata } = metadata ?? {};

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
            url: urlcat(SITE_URL, pathname),
            siteName: SITE_NAME,
            images: [`${SITE_URL}/image/og.png`],
            ...openGraph,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            creator: '@thefireflyapp',
            images: [`${SITE_URL}/image/og.png`],
            ...twitter,
        },
        manifest: '/site.webmanifest',
        icons: [
            {
                url: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: FileMimeType.PNG,
            },
            {
                url: '/android-chrome-384x384.png',
                sizes: '384x384',
                type: FileMimeType.PNG,
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
            canonical: urlcat(SITE_URL_OFFICIAL, pathname),
        },
        ...restMetadata,
    } satisfies Metadata;
}
