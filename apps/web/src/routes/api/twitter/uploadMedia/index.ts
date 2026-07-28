import type { ApiContext } from '@dimensiondev/ssr';
import { compose, parseJson } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getFormDataWithZodSchema } from '@/helpers/getFormDataWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FileSchema } from '@/schemas/File.js';

const UploadSchema = z
    .object({
        type: z.string().optional(),
        mimeType: z.string().optional(),
        target: z.enum(['tweet', 'dm']).optional(),
        chunkLength: z.number().int().positive().optional(),
        shared: z.boolean().optional(),
        longVideo: z.boolean().optional(),
    })
    .optional();

const FormDataSchema = z.object({
    options: z
        .string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            const parsed = parseJson(val);
            return parsed || undefined;
        })
        .pipe(UploadSchema),
    file: FileSchema,
});

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { file, options } = await getFormDataWithZodSchema(request, FormDataSchema);

        const client = await createTwitterClientV2(request);
        const response = await client.v1.uploadMedia(Buffer.from(await file.arrayBuffer()), {
            mimeType: file.type,
            ...(options || {}),
        });

        return createSuccessResponseJson({ media_id: response, media_id_string: response });
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
