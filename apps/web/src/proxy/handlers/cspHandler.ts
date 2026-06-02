/* cspell:disable */

import { IS_DEVELOPMENT } from '@dimensiondev/constants';
import { type NextRequest, NextResponse } from 'next/server.js';

const EXTRA_SOURCES = IS_DEVELOPMENT
    ? [
          'http://localhost:3000',
          'http://localhost:3001',
          'ws://localhost:3000',
          'ws://localhost:3001',
          '*.vercel-scripts.com',
          'vercel.live',
      ]
    : [];

/**
 * Builds CSP policy.
 * This matches the CSP_SETTINGS from next.config.ts
 */
function buildCSP(): string {
    const defaultSrc = ["'self'", ...EXTRA_SOURCES];

    const connectSrc = [
        "'self'",
        // First party
        '*.r2d2.to',
        'api.firefly.land',
        'api-dev.firefly.land',
        'firefly.land',
        '*.grove.storage',

        'stream.farcaster.xyz',
        '*.bsky.network',
        'bsky.social',
        'public.api.bsky.app',
        '*.farcaster.xyz',
        'api.warpcast.com',

        // CDN
        '*.cloudflarestream.com',

        // Twitter
        'video.twimg.com',

        // Lens
        'api.lens.xyz',
        'rpc.lens.xyz',

        'static.cloudflareinsights.com',
        '*.google-analytics.com',

        // Web3 APIs
        '*.quiknode.pro',
        'auth.privy.io',
        'api.web3modal.org',
        'cca-lite.coinbase.com',
        'eth.llamarpc.com',
        'polygon.drpc.org',
        '*.alchemy.com',

        // polymarket
        '*.polymarket.com',
        'wss://ws-subscriptions-clob.polymarket.com',

        '*.walletconnect.com',
        '*.walletconnect.org',
        'wss://*.walletconnect.org',
        ...EXTRA_SOURCES,
    ];

    const scriptSrc = [
        "'self'",
        "'report-sample'",
        // apps/web/src/app/layout.tsx
        // enable hash-based script in development will require all scripts to be trusted, which will break dev mode of React and Next.js
        IS_DEVELOPMENT ? null : "'sha256-L470bX2hxikL0zolJ8AuD4n339IGj2H/dlbuf1rdlpU='",
        IS_DEVELOPMENT ? "'unsafe-eval' 'unsafe-inline'" : null,
        'www.googletagmanager.com',
        'static.cloudflareinsights.com',
        ...EXTRA_SOURCES,
    ].filter(Boolean) as string[];

    const mediaSrc = ['*', 'data:', 'blob:'];

    const styleSrc = [
        "'self'",
        "'unsafe-inline'",
        'fonts.reown.com',
        'fonts.googleapis.com',
        'media.firefly.land',
        // TODO: really? why we have CSS from these domains?
        'coin-images.coingecko.com',
        'imagedelivery.net',
        'warpcast.com',
        ...EXTRA_SOURCES,
    ];

    const fontSrc = [
        "'self'",
        'fonts.reown.com',
        'fonts.googleapis.com',
        'imagedelivery.net',
        'coin-images.coingecko.com',
        'media.firefly.land',
        'warpcast.com',
        ...EXTRA_SOURCES,
    ];

    // fallback to child-src, then default-src
    const workerSrc = ["'self'", ...EXTRA_SOURCES];

    // what iframe we can load, fallback to child-src, then default-src
    const frameSrc = [
        "'self'",
        'player.twitch.tv',
        'clips.twitch.tv',
        'https://verify.walletconnect.org',
        ...EXTRA_SOURCES,
    ];

    const directives = [
        `default-src ${defaultSrc.join(' ')}`,
        `connect-src ${connectSrc.join(' ')}`,
        `script-src ${scriptSrc.join(' ')}`,
        `img-src ${mediaSrc.join(' ')}`,
        `media-src ${mediaSrc.join(' ')}`,
        `style-src ${styleSrc.join(' ')}`,
        `font-src ${fontSrc.join(' ')}`,
        `worker-src ${workerSrc.join(' ')}`,
        `frame-src ${frameSrc.join(' ')}`,
    ].filter(Boolean);

    return directives.join('; ');
}

/**
 * CSP handler that adds Report-Only CSP header.
 */
export function handleCSP(_request: NextRequest, next: () => NextResponse | undefined) {
    const response = next();

    if (response) {
        const csp = buildCSP();

        const modifiedResponse = new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        if (IS_DEVELOPMENT) {
            modifiedResponse.headers.set('Content-Security-Policy', csp);
        } else {
            modifiedResponse.headers.set('Content-Security-Policy-Report-Only', csp);
        }

        return modifiedResponse;
    }

    return response;
}

export const config = {
    matcher: [
        {
            source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
