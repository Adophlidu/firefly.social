import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

// Per-visitor geo hints derived from Vercel's edge headers. Middleware used to
// copy these into cookies, but any Set-Cookie disables Vercel CDN caching for the
// HTML response, so the client fetches them here instead. The response itself is
// per-visitor, hence no-store.
const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    return createSuccessResponseJson(
        {
            timezone: request.headers.get('x-vercel-ip-timezone'),
            city: request.headers.get('x-vercel-ip-city'),
            country: request.headers.get('x-vercel-ip-country'),
            region: request.headers.get('x-vercel-ip-country-region'),
        },
        {
            headers: {
                'Cache-Control': 'private, no-store',
            },
        },
    );
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
