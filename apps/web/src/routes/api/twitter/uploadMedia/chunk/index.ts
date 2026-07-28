import { TWITTER_UPLOAD_MEDIA_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import urlcat from 'urlcat';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FinishUploadSchema } from '@/schemas/Media.js';
import type { GetUploadStatusResponse } from '@/types/twitter.js';

// Finish upload
const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsWithZodSchema(request, FinishUploadSchema);

        const client = await createTwitterClientV2(request);
        const data = await client.post<GetUploadStatusResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, { ...queryParams, command: 'FINALIZE' }),
        );

        return createSuccessResponseJson(data);
    },
);

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsWithZodSchema(request, FinishUploadSchema);

        const client = await createTwitterClientV2(request);
        const data = await client.get<GetUploadStatusResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, { ...queryParams, command: 'STATUS' }),
        );

        return createSuccessResponseJson(data);
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
