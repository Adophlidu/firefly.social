import { WARPCAST_ROOT_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const ParamsSchema = z.object({
    channelId: z.string(),
});

const HeadersSchema = z.object({
    'x-token': z.string().min(1, 'Missing farcaster token'),
});

const postHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId } = ParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const { 'x-token': token } = getHeadersWithZodSchema(request, HeadersSchema);

    await fetchJson(urlcat(WARPCAST_ROOT_URL, '/fc/channel-follows'), {
        method: 'POST',
        body: JSON.stringify({ channelId }),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    return createSuccessResponseJson({
        following: true,
    });
});

const deleteHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId } = ParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const { 'x-token': token } = getHeadersWithZodSchema(request, HeadersSchema);

    await fetchJson(urlcat(WARPCAST_ROOT_URL, '/fc/channel-follows'), {
        method: 'DELETE',
        body: JSON.stringify({ channelId }),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    return createSuccessResponseJson({
        following: false,
    });
});

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}

export function DELETE({ request }: ApiContext) {
    return deleteHandler(request as NextRequest);
}
