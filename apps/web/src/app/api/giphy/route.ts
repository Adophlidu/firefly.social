import { envs } from '@dimensiondev/envs/web';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';

export const runtime = 'edge';

const ParamsSchema = z.object({
    q: z.string().default(''),
});

export async function GET(request: NextRequest) {
    const { q } = getSearchParamsWithZodSchema(request, ParamsSchema);
    const endpoint = q ? 'search' : 'trending';
    const response = await fetch(
        urlcat(`https://api.giphy.com/v1/gifs/${endpoint}`, {
            api_key: envs.external.NEXT_PUBLIC_GIPHY_API_KEY,
            limit: 24,
            rating: 'g',
            lang: 'en',
            q: q || undefined,
        }),
        { cache: 'no-store' },
    );

    return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: {
            'Cache-Control': 'private, max-age=60',
            'Content-Type': response.headers.get('content-type') ?? 'application/json',
        },
    });
}
