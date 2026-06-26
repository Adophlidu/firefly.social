import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

/**
 * Same-origin image proxy for client-side canvas rendering (the Polymarket share image).
 *
 * The share card is rasterized in the browser via `<img crossOrigin> → <canvas>`, which requires the
 * source to be CORS-enabled — Polymarket market icons / team logos live on S3/CDN hosts that omit the
 * `Access-Control-Allow-Origin` header, so a direct load taints the canvas and the image drops out.
 * Streaming the bytes back through this same-origin route sidesteps CORS entirely (and works in dev,
 * where `next/image` optimization is disabled). Restricted to https image responses to avoid being a
 * general-purpose request proxy.
 */
export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const target = request.nextUrl.searchParams.get('url');
    if (!target) return createErrorResponseJson('Missing url');

    let parsed: URL;
    try {
        parsed = new URL(target);
    } catch {
        return createErrorResponseJson('Invalid url');
    }

    if (parsed.protocol !== 'https:') return createErrorResponseJson('Only https urls are allowed');

    const response = await fetch(target);
    if (!response.ok) return createErrorResponseJson('Unable to access the image');

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return createErrorResponseJson('Not an image');

    return new Response(response.body, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': response.headers.get('cache-control') || CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
});
