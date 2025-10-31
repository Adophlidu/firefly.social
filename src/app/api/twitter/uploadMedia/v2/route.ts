import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import type { EUploadMimeType } from 'twitter-api-v2';

import { MalformedError } from '@/constants/error.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) throw new MalformedError('file not found');

        const client = await createTwitterClientV2();
        const media_id = await client.v2.uploadMedia(Buffer.from(await file.arrayBuffer()), {
            media_type: file.type as EUploadMimeType,
        });

        return createSuccessResponseJson({ media_id });
    },
);
