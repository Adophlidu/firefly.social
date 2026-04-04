import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FinishUploadSchema } from '@/schemas/Media.js';
import { type FinishUploadResponseV2, type GetUploadStatusResponseV2 } from '@/types/twitter.js';

// Finish upload
export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { media_id } = getSearchParamsWithZodSchema(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.post<{ data: FinishUploadResponseV2 }>(`media/upload/${media_id}/finalize`);

        return createSuccessResponseJson(data);
    },
);

// Get upload status
export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { media_id } = getSearchParamsWithZodSchema(request, FinishUploadSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.get<{ data: GetUploadStatusResponseV2 }>(
            urlcat('media/upload', { media_id, command: 'STATUS' }),
        );

        return createSuccessResponseJson(data);
    },
);
