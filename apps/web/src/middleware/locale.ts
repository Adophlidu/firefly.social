import { Locale } from '@dimensiondev/enums';
import type { MiddlewareFn } from '@dimensiondev/ssr';

const LOCALES = new Set<string>(Object.values(Locale));

/**
 * Backward compatibility for legacy locale-prefixed URLs (`/en/posts` →
 * `/posts`): locales are resolved per request now, so the prefix is a pure
 * redirect (308 permanent).
 */
export const legacyLocaleRedirects: MiddlewareFn = (request, { next }) => {
    const url = new URL(request.url);
    const [, first, ...rest] = url.pathname.split('/');
    if (first && LOCALES.has(first) && rest.length > 0) {
        return Response.redirect(new URL(`/${rest.join('/')}${url.search}`, request.url), 308);
    }
    if (first && LOCALES.has(first)) {
        return Response.redirect(new URL(`/${url.search}`, request.url), 308);
    }
    return next();
};
