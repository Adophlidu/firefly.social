import { TWITTER_UPLOAD_MEDIA_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getFormDataWithZodSchema } from '@/helpers/getFormDataWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FileSchema } from '@/schemas/File.js';
import { AppendMediaSchema } from '@/schemas/Media.js';

const FormDataSchema = z.object({
    media: FileSchema,
});

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { media_id, segment_index } = getSearchParamsWithZodSchema(request, AppendMediaSchema);
        const { media: file } = await getFormDataWithZodSchema(request, FormDataSchema);

        const client = await createTwitterClientV2(request);
        await client.post(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, {
                media_id,
                segment_index,
                command: 'APPEND',
            }),
            {
                media: Buffer.from(await file.arrayBuffer()),
            },
        );

        return createSuccessResponseJson({ media_id, index: segment_index });
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
