import { envs } from '@dimensiondev/envs/web';
import type { ApiContext } from '@dimensiondev/ssr';
import urlcat from 'urlcat';
import { z } from 'zod';

const ParamsSchema = z.object({
    q: z.string().default(''),
});

export async function GET({ request }: ApiContext) {
    const { q } = ParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const endpoint = q ? 'search' : 'trending';
    const response = await fetch(
        urlcat(`https://api.giphy.com/v1/gifs/${endpoint}`, {
            api_key: envs.external.NEXT_PUBLIC_GIPHY_API_KEY,
            limit: 24,
            rating: 'g',
            lang: 'en',
            q: q || undefined,
        }),
    );

    return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: {
            'Cache-Control': 'private, max-age=60',
            'Content-Type': response.headers.get('content-type') ?? 'application/json',
        },
    });
}
