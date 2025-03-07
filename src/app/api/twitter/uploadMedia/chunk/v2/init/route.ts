import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { createTwitterClientV2 } from '@/helpers/createTwitterClientV2.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/helpers/withTwitterRequestErrorHandler.js';
import type { UploadMediaResponseV2 } from '@/types/twitter.js';

const InitMediaSchema = z.object({
    total_bytes: z.string(),
    media_type: z.string(),
    media_category: z.string().optional(),
    additional_owners: z.string().optional(),
});

export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withRequestErrorHandler({ throwError: true }),
    withTwitterRequestErrorHandler,
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, InitMediaSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.post<{ data: UploadMediaResponseV2 }>(
            urlcat('media/upload', {
                ...queryParams,
                command: 'INIT',
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        );

        return createSuccessResponseJSON(data);
    },
);
