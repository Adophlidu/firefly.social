import { WARPCAST_ROOT_URL_V1 } from '@dimensiondev/constants/static';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

export const runtime = 'edge';

const Schema = z.object({
    channelId: z.string(),
    fid: z.string(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid } = getSearchParamsWithZodSchema(request, Schema);

    const response = await fetchJson<{ result: { following: boolean } }>(
        urlcat(WARPCAST_ROOT_URL_V1, '/user-channel', {
            fid,
            channelId,
        }),
    );

    return createSuccessResponseJson({
        following: response?.result?.following ?? false,
    });
});
