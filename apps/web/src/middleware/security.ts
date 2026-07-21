import type { MiddlewareFn } from '@dimensiondev/ssr';

/**
 * Security headers (static CSP — the nonce-based CSP in src/proxy needs a
 * response-transform pass that the middleware layer doesn't have yet).
 * HSTS/XFO/nosniff come from Cloudflare/wrangler responses here.
 */
export const securityHeaders: MiddlewareFn = async (request, { next }) => {
    const response = await next();

    if (response.headers.get('content-type')?.includes('text/html')) {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https: wss:",
            "frame-src 'self' https:",
            "media-src 'self' https: blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ].join('; ');
        response.headers.set('content-security-policy', csp);
    }

    response.headers.set('x-content-type-options', 'nosniff');
    response.headers.set('x-frame-options', 'SAMEORIGIN');
    response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');

    return response;
};
