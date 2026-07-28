import { EXCEPTION_TRACKER_URL } from '@dimensiondev/constants/static';
import { envs } from '@dimensiondev/envs/web';
import { isExceptionTrackerEnabled } from '@dimensiondev/exception-tracker';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

// Headers that should not be forwarded to the upstream tracker
const EXCLUDED_HEADERS = new Set([
    'host',
    'connection',
    'content-length',
    'transfer-encoding',
    'keep-alive',
    'upgrade',
    'expect',
    'trailer',
]);

const postHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    if (!isExceptionTrackerEnabled()) {
        return createSuccessResponseJson({ queued: false });
    }

    const apiKey = envs.internal.FIREFLY_EXCEPTION_TRACKER_API_KEY;
    if (!apiKey) throw new Error('Exception tracker API key is not configured');

    const body = await request.text();

    // Build the upstream URL with api_key as query parameter
    const upstreamUrl = urlcat(EXCEPTION_TRACKER_URL, '/api/exceptions', {
        api_key: apiKey,
    });

    // Forward client headers, excluding hop-by-hop headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        if (!EXCLUDED_HEADERS.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    // Ensure content-type is set for JSON
    if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
    }

    // Forward the request to the upstream tracker
    const response = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upstream tracker error: ${response.status} - ${errorText}`);
    }

    return createSuccessResponseJson({ queued: true });
});

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
