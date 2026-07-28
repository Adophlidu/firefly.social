import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';

import { createErrorResponseJson } from '@/helpers/createResponseJson.js';

function wrap(response: Response) {
    return new Response(response.body, {
        headers: {
            'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
            'Cache-Control': response.headers.get('cache-control') || CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

/**
 * Proxy an image URL. When `sameOriginFetch` is provided, the URL's path is
 * resolved through it first — on Workers the ASSETS binding serves the same
 * static files without an HTTP self-request (which 404s for asset paths).
 */
export async function createProxyImageResponse(url: string, sameOriginFetch?: (path: string) => Promise<Response>) {
    if (sameOriginFetch) {
        const path = new URL(url).pathname + new URL(url).search;
        const local = await sameOriginFetch(path).catch(() => null);
        if (local?.ok) return wrap(local);
    }

    const response = await fetch(url);
    if (!response.ok) return createErrorResponseJson('Unable to access the image');

    return wrap(response);
}
