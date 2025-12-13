import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { WARPCAST_ROOT_URL } from '@/constants/static.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const ParamsSchema = z.object({
    channelId: z.string(),
});

const HeadersSchema = z.object({
    'x-token': z.string().min(1, 'Missing farcaster token'),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId } = getSearchParamsWithZodSchema(request, ParamsSchema);
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

export const DELETE = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId } = getSearchParamsWithZodSchema(request, ParamsSchema);
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
