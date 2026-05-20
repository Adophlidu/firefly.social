import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';

export async function createRedirectResponse(url: string) {
    return new Response(null, {
        status: 301,
        headers: {
            Location: url,
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}
