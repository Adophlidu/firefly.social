import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { WARPCAST_ROOT_URL } from '@/constants/index.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const Schema = z.object({
    channelId: z.string(),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId } = getSearchParamsFromRequestWithZodObject(request, Schema);
    const token = request.headers.get('X-Token');
    if (!token) throw new Error('Missing farcaster token');

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
    const { channelId } = getSearchParamsFromRequestWithZodObject(request, Schema);
    const token = request.headers.get('X-Token');
    if (!token) throw new Error('Missing farcaster token');

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
