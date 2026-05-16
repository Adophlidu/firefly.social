import type { Context } from 'hono';

import { parseUrl } from '@/shared/src/helpers/parseUrl.js';

export function getOrigin(c: Context) {
    const isDev = c.req.raw.headers.get('X-DEVELOPMENT-API') === 'true';
    const env = isDev ? 'staging' : 'production';

    const origin = c.req.raw.headers.get('origin');
    const hostname = origin ? (parseUrl(origin)?.hostname ?? 'unknown') : 'unknown';

    return `${env}:${hostname}`;
}
