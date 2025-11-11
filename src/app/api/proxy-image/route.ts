import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { FIREFLY_STAMP_DEV_URL, FIREFLY_STAMP_URL } from '@/constants/index.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';

const querySchema = z.object({
    url: z.string(),
});

function isStampAvatar(url: string) {
    return url.startsWith(FIREFLY_STAMP_URL) || url.startsWith(FIREFLY_STAMP_DEV_URL);
}

// proxy image response
export const GET = async (request: NextRequest) => {
    const { url } = getSearchParamsFromRequestWithZodObject(request, querySchema);
    if (!url) {
        return new Response('URL is required', {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const response = await fetch(url, {
            headers: isStampAvatar(url)
                ? {
                      'User-Agent': 'Mozilla/5.0 (compatible; Firefly/1.0)',
                  }
                : undefined,
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
    } catch (error) {
        return new Response('Error fetching image', { status: 500 });
    }
};
