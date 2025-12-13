import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { TWITTER_UPLOAD_MEDIA_URL } from '@/constants/static.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FinishUploadSchema } from '@/schemas/Media.js';
import type { GetUploadStatusResponse } from '@/types/twitter.js';

// Finish upload
export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsWithZodSchema(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const data = await client.post<GetUploadStatusResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, { ...queryParams, command: 'FINALIZE' }),
        );

        return createSuccessResponseJson(data);
    },
);

// Get upload status
export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsWithZodSchema(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const data = await client.get<GetUploadStatusResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, { ...queryParams, command: 'STATUS' }),
        );

        return createSuccessResponseJson(data);
    },
);
