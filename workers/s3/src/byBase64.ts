import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { base64ToFile } from '@/s3/src/base64ToFile.js';
import { MediaTokenSchema } from '@/s3/src/schema.js';
import { uploadToS3 } from '@/s3/src/uploadToS3ByBase64.js';

const ByBase64Route = new Hono();

const UploadSchema = z.object({
    file: z.string(), // base64 encoded file data
    fileKey: z.string(),
    mediaToken: MediaTokenSchema,
});

ByBase64Route.post(
    '/upload',
    zValidator('json', UploadSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { file: base64File, fileKey, mediaToken } = c.req.valid('json');

            // Process base64 file and create File object
            const file = base64ToFile(base64File, fileKey);

            const url = await uploadToS3(file, fileKey, mediaToken, c);
            return createSuccessResponseJson({ url });
        }),
);

export { ByBase64Route };
