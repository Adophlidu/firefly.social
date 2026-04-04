import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getFormDataWithZodSchema } from '@/helpers/getFormDataWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { AnyFileSchema } from '@/schemas/File.js';
import { AppendMediaSchema } from '@/schemas/Media.js';

const FormDataSchema = z.object({
    media: AnyFileSchema,
});

export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { media_id, segment_index } = getSearchParamsWithZodSchema(request, AppendMediaSchema);
        const { media: file } = await getFormDataWithZodSchema(request, FormDataSchema);

        const client = await createTwitterClientV2();
        await client.v2.post(
            `media/upload/${media_id}/append`,
            {
                media: Buffer.from(await file.arrayBuffer()),
                segment_index: Number(segment_index),
            },
            { forceBodyMode: 'form-data' },
        );

        return createSuccessResponseJson({ media_id, index: segment_index });
    },
);
