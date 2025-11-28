import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { fetch } from '@/helpers/fetch.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const querySchema = z.object({
    url: z.string(),
});

// proxy image response
export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { url } = getSearchParamsWithZodSchema(request, querySchema);

    const response = await fetch(url, undefined, {
        noStrictOK: true,
    });
    if (!response.ok) {
        return new Response('Unable to access the image', {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(response.body, {
        headers: {
            'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
            'Cache-Control': response.headers.get('cache-control') || 'public, max-age=31536000',
        },
    });
});
