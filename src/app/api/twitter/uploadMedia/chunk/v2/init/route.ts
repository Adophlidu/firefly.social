import { compose } from '@firefly/utils';
import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { UploadMediaResponseV2 } from '@/types/twitter.js';

const InitMediaSchema = z.object({
    total_bytes: z.string(),
    media_type: z.string(),
    media_category: z.string().optional(),
    additional_owners: z.string().optional(),
});

export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, InitMediaSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.post<{ data: UploadMediaResponseV2 }>('media/upload/initialize', {
            ...queryParams,
            total_bytes: Number(queryParams.total_bytes),
        });

        return createSuccessResponseJson(data);
    },
);
