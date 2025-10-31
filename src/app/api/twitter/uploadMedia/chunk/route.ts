import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { TWITTER_UPLOAD_MEDIA_URL } from '@/constants/index.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { GetUploadStatusResponse } from '@/types/twitter.js';

const FinishUploadSchema = z.object({
    media_id: z.string(),
});

// Finish upload
export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const data = await client.post<GetUploadStatusResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, { ...queryParams, command: 'FINALIZE' }),
        );

        return createSuccessResponseJson(data);
    },
);

// Get upload status
export const GET = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const data = await client.get<GetUploadStatusResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, { ...queryParams, command: 'STATUS' }),
        );

        return createSuccessResponseJson(data);
    },
);
