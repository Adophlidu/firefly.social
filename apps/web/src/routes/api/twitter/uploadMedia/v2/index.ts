import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { EUploadMimeType } from 'twitter-api-v2';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getFormDataWithZodSchema } from '@/helpers/getFormDataWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FileSchema } from '@/schemas/File.js';

const FormDataSchema = z.object({
    file: FileSchema,
});

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { file } = await getFormDataWithZodSchema(request, FormDataSchema);

        const client = await createTwitterClientV2(request);
        const media_id = await client.v2.uploadMedia(Buffer.from(await file.arrayBuffer()), {
            media_type: file.type as EUploadMimeType,
        });

        return createSuccessResponseJson({ media_id });
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
