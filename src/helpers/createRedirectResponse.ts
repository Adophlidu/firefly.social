import { StatusCodes } from 'http-status-codes';

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@/constants/index.js';

export async function createRedirectResponse(url: string) {
    return new Response(null, {
        status: StatusCodes.MOVED_PERMANENTLY,
        headers: {
            Location: url,
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}
