import type { Context } from 'hono';

import { SITE_URL, STAGING_SITE_URL } from '@/shared/src/constants/metadata.js';

export function resolveSiteUrl(c: Context) {
    return c.req.raw.headers.get('X-DEVELOPMENT-API') === 'true' ? STAGING_SITE_URL : SITE_URL;
}
