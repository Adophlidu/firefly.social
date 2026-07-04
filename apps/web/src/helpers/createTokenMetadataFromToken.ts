import type { CoinGeckoToken } from '@dimensiondev/workers-token';
import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function createTokenMetadataFromToken(token: CoinGeckoToken, pathname: string): Metadata {
    const title = `View $${token.symbol.toUpperCase()} on Firefly`;
    const description = `Track ${token.name} in real time, swap tokens and see social sentiment all on Firefly.`;
    const ogImage = token.logoURL;

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'profile',
            title,
            description,
            images: [ogImage],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: [ogImage],
        },
    });
}
