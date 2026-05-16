import type { Context } from 'hono';

import { FIREFLY_DEV_ROOT_URL, FIREFLY_ROOT_URL } from '@/shared/src/constants/metadata.js';

export function resolveFireflyRootUrl(c: Context) {
    return c.req.raw.headers.get('X-DEVELOPMENT-API') === 'true' ? FIREFLY_DEV_ROOT_URL : FIREFLY_ROOT_URL;
}
