import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { WARPCAST_ROOT_URL_V1 } from '@/constants/index.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const Schema = z.object({
    channelId: z.string(),
    fid: z.string(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { channelId, fid } = getSearchParamsFromRequestWithZodObject(request, Schema);

    const response = await fetchJSON<{ result: { following: boolean } }>(
        urlcat(WARPCAST_ROOT_URL_V1, '/user-channel', {
            fid,
            channelId,
        }),
    );

    return createSuccessResponseJSON({
        following: response?.result?.following ?? false,
    });
});
