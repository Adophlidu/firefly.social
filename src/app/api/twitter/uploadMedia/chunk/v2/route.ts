import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { createTwitterClientV2 } from '@/helpers/createTwitterClientV2.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/helpers/withTwitterRequestErrorHandler.js';
import type { FinishUploadResponseV2, GetUploadStatusResponseV2 } from '@/types/twitter.js';

const FinishUploadSchema = z.object({
    media_id: z.string(),
});

// Finish upload
export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withRequestErrorHandler({ throwError: true }),
    withTwitterRequestErrorHandler,
    async (request) => {
        const { media_id } = getSearchParamsFromRequestWithZodObject(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.post<{ data: FinishUploadResponseV2 }>(
            urlcat('media/upload', {
                media_id,
                command: 'FINALIZE',
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        );

        return createSuccessResponseJSON(data);
    },
);

// Get upload status
export const GET = compose<(request: NextRequest) => Promise<Response>>(
    withRequestErrorHandler({ throwError: true }),
    withTwitterRequestErrorHandler,
    async (request) => {
        const { media_id } = getSearchParamsFromRequestWithZodObject(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.get<{ data: GetUploadStatusResponseV2 }>(
            urlcat('media/upload', { media_id, command: 'STATUS' }),
        );

        return createSuccessResponseJSON(data);
    },
);
