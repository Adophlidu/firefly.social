import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { MalformedError } from '@/constants/error.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { createTwitterClientV2 } from '@/helpers/createTwitterClientV2.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/helpers/withTwitterRequestErrorHandler.js';

const AppendMediaSchema = z.object({
    media_id: z.string(),
    segment_index: z.string(),
});

export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withRequestErrorHandler({ throwError: true }),
    withTwitterRequestErrorHandler,
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, AppendMediaSchema);

        const requestForm = await request.formData();
        const file = requestForm.get('media') as File | null;
        if (!file) throw new MalformedError('file not found');

        const client = await createTwitterClientV2();
        await client.v2.post(
            `media/upload/${queryParams.media_id}/append`,
            {
                media: Buffer.from(await file.arrayBuffer()),
                segment_index: Number(queryParams.segment_index),
            },
            { forceBodyMode: 'form-data' },
        );

        return createSuccessResponseJSON({ media_id: queryParams.media_id, index: queryParams.segment_index });
    },
);
