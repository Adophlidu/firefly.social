import { SITE_URL } from '@dimensiondev/envs/web';
import type { CoinGeckoToken } from '@dimensiondev/workers-token';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';

function resolveTokenOgImageUrl(token: CoinGeckoToken, pathname: string) {
    if (pathname.startsWith('/token/dex/') || pathname.startsWith('/token/cex/')) {
        return urlcat(SITE_URL, `/api/og/token/${pathname.slice('/token/'.length)}/image`);
    }

    if (token.id) {
        return urlcat(SITE_URL, '/api/og/token/cex/:id/image', { id: token.id });
    }

    if (token.chainId && token.address) {
        return urlcat(SITE_URL, '/api/og/token/dex/:chainId/:address/image', {
            chainId: token.chainId,
            address: token.address,
        });
    }

    return getDefaultOgImageUrl();
}

export function createTokenMetadataFromToken(token: CoinGeckoToken, pathname: string): Metadata {
    const title = `View $${token.symbol.toUpperCase()} on Firefly`;
    const description = `Track ${token.name} in real time, swap tokens and see social sentiment all on Firefly.`;
    const ogImageUrl = resolveTokenOgImageUrl(token, pathname);

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'website',
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
