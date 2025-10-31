import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { FinishUploadResponseV2, GetUploadStatusResponseV2 } from '@/types/twitter.js';

const FinishUploadSchema = z.object({
    media_id: z.string(),
});

// Finish upload
export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { media_id } = getSearchParamsFromRequestWithZodObject(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.post<{ data: FinishUploadResponseV2 }>(`media/upload/${media_id}/finalize`);

        return createSuccessResponseJson(data);
    },
);

// Get upload status
export const GET = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { media_id } = getSearchParamsFromRequestWithZodObject(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.get<{ data: GetUploadStatusResponseV2 }>(
            urlcat('media/upload', { media_id, command: 'STATUS' }),
        );

        return createSuccessResponseJson(data);
    },
);
