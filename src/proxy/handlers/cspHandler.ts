/* cspell:disable */

import { randomBytes } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server.js';

import { IS_DEVELOPMENT } from '@/constants/static.js';

const DEVELOPMENT_SOURCES = IS_DEVELOPMENT ? ['http://localhost:3000', 'ws://localhost:3000'] : [];

/**
 * Builds CSP policy with nonce
 * This matches the CSP_SETTINGS from next.config.ts
 */
function buildCSPWithNonce(nonce: string): string {
    const scriptSrc = [
        "'self'",
        'www.googletagmanager.com',
        'static.cloudflareinsights.com',
        'cdn.jsdelivr.net',
        '*.vercel-scripts.com',
        '*.firefly.land',
        'vercel.live',
        `'nonce-${nonce}'`,
        ...DEVELOPMENT_SOURCES,
    ];

    const defaultSrc = ["'self'", 'https:', 'wss:', 'data:', 'blob:', ...DEVELOPMENT_SOURCES];

    const imgSrc = ["'self'", 'https:', 'data:', 'blob:', ...DEVELOPMENT_SOURCES];

    const styleSrc = ["'self'", "'unsafe-inline'", 'vercel.live', 'fonts.googleapis.com', ...DEVELOPMENT_SOURCES];

    const workerSrc = ["'self'", 'blob:', ...DEVELOPMENT_SOURCES];

    const directives = [
        `default-src ${defaultSrc.join(' ')}`,
        `script-src ${scriptSrc.join(' ')}`,
        `img-src ${imgSrc.join(' ')}`,
        `style-src ${styleSrc.join(' ')}`,
        `worker-src ${workerSrc.join(' ')}`,
    ];

    // Add report-uri if Sentry is configured
    if (process.env.NEXT_PUBLIC_SENTRY_REPORT_URL) {
        directives.push(`report-uri ${process.env.NEXT_PUBLIC_SENTRY_REPORT_URL}`);
    }

    return directives.join('; ');
}

/**
 * CSP handler that generates a nonce and adds it to the CSP header
 * This should run first in the middleware chain to ensure nonce is available
 */
export function handleCSP(request: NextRequest, next: () => NextResponse | undefined) {
    // Generate nonce for this request
    const nonce = randomBytes(16).toString('base64');

    // Add nonce to request headers so it can be accessed in server components
    request.headers.set('X-CSP-Nonce', nonce);

    // Continue with the request chain
    const response = next();

    // If we have a response, modify it to include the nonce in CSP header
    if (response) {
        // Build CSP policy with nonce
        const cspWithNonce = buildCSPWithNonce(nonce);

        // Create a new response with modified headers
        // We need to clone to avoid mutating the original response
        const modifiedResponse = new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        // Override the CSP header with nonce (this will override any CSP from next.config.ts)
        modifiedResponse.headers.set('Content-Security-Policy-Report-Only', cspWithNonce);

        return modifiedResponse;
    }

    return response;
}
