import type { MiddlewareFn } from '@dimensiondev/ssr';

import { externalRewrites } from '@/middleware/external.js';
import { legacyLocaleRedirects } from '@/middleware/locale.js';
import { referralTracking, requestAnnotations } from '@/middleware/requests.js';
import { clubRoutes, legacyRedirects, profileRoutes } from '@/middleware/routes.js';
import { securityHeaders } from '@/middleware/security.js';

/**
 * Middleware chain for the new SSR app, mirroring src/proxy.ts (Next
 * middleware). Locale is resolved per request in the root layout loader —
 * no locale prefix rewrite needed (legacy prefixed URLs 308-redirect).
 */
export const appMiddleware: MiddlewareFn[] = [
    legacyLocaleRedirects,
    legacyRedirects,
    profileRoutes,
    clubRoutes,
    requestAnnotations,
    externalRewrites,
    referralTracking,
    securityHeaders,
];
