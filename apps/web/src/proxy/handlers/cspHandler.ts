/* cspell:disable */

import { IS_DEVELOPMENT } from '@dimensiondev/constants';
import { type NextRequest, NextResponse } from 'next/server.js';

import { SITE_URL } from '@/constants/static.js';

/** Production-only CSP violation ingestion (not per-request origin). */
const CSP_REPORT_URI = `${SITE_URL}/api/beacon/csp-report`;

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
        'api.firefly.land',
        'api.lens.xyz',
        'api.web3modal.org',
        'pulse.walletconnect.org',
        'static.cloudflareinsights.com',
        ...EXTRA_SOURCES,
    ];

    const scriptSrc = [
        "'self'",
        'api.firefly.land',
        'api.lens.xyz',
        'api.web3modal.org',
        'www.googletagmanager.com',
        'pulse.walletconnect.org',
        'static.cloudflareinsights.com',
        ...EXTRA_SOURCES,
    ];

    const imgSrc = [
        "'self'",
        'i.imgur.com',
        'api.web3modal.org',
        'stamp.firefly.land',
        'media.firefly.land',
        'imagedelivery.net',
        'ik.imagekit.io',
        'api.grove.storage',
        'cdn.bsky.app',
        'public.rootdata.com',
        ...EXTRA_SOURCES,
    ];

    const styleSrc = ["'self'", "'unsafe-inline'", 'fonts.reown.com', 'fonts.googleapis.com', ...EXTRA_SOURCES];

    const fontSrc = ["'self'", 'fonts.reown.com', 'fonts.googleapis.com', ...EXTRA_SOURCES];

    const workerSrc = ["'self'", ...EXTRA_SOURCES];

    const directives = [
        `default-src ${defaultSrc.join(' ')}`,
        `connect-src ${connectSrc.join(' ')}`,
        `script-src ${scriptSrc.join(' ')}`,
        `img-src ${imgSrc.join(' ')}`,
        `style-src ${styleSrc.join(' ')}`,
        `font-src ${fontSrc.join(' ')}`,
        `worker-src ${workerSrc.join(' ')}`,
        `report-uri ${CSP_REPORT_URI}`,
    ];

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

        modifiedResponse.headers.set('Content-Security-Policy-Report-Only', csp);

        return modifiedResponse;
    }

    return response;
}
