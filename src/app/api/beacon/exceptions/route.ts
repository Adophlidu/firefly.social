import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { EXCEPTION_TRACKER_URL } from '@/constants/static.js';
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

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const apiKey = env.internal.FIREFLY_EXCEPTION_TRACKER_API_KEY;
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

    // Return the upstream response status
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upstream tracker error: ${response.status} - ${errorText}`);
    }

    return createSuccessResponseJson({ queued: true });
});
