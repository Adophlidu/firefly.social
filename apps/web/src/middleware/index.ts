import type { MiddlewareFn } from '@dimensiondev/ssr';

import { localeRewrite, referralTracking, requestAnnotations } from '@/middleware/requests.js';
import { clubRoutes, legacyRedirects, profileRoutes } from '@/middleware/routes.js';
import { securityHeaders } from '@/middleware/security.js';

/**
 * Middleware chain for the new SSR app, mirroring src/proxy.ts (Next
 * middleware). Order matters: redirects/rewrites first, locale last.
 */
export const appMiddleware: MiddlewareFn[] = [
    legacyRedirects,
    profileRoutes,
    clubRoutes,
    requestAnnotations,
    localeRewrite,
    referralTracking,
    securityHeaders,
];
