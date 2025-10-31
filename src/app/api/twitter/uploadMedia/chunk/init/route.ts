import { compose } from '@firefly/utils';
import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { TWITTER_UPLOAD_MEDIA_URL } from '@/constants/index.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { UploadMediaResponse } from '@/types/twitter.js';

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
        const { media_id_string } = await client.post<UploadMediaResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, {
                ...queryParams,
                command: 'INIT',
            }),
        );

        return createSuccessResponseJson({ media_id: media_id_string, media_id_string });
    },
);
