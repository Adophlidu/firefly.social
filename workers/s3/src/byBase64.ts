import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { base64ToFile } from '@/s3/src/base64ToFile.js';
import { MediaTokenSchema } from '@/s3/src/schema.js';
import { uploadToS3 } from '@/s3/src/uploadToS3ByBase64.js';

const UploadSchema = z.object({
    file: z.string(), // base64 encoded file data
    fileKey: z.string(),
    mediaToken: MediaTokenSchema,
});

const ByBase64Route = new Hono().post(
    '/upload',
    zValidator('json', UploadSchema, (result, c) => {
        if (!result.success) {
            return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
        }
        return;
    }),
    async (c) => {
        const { file: base64File, fileKey, mediaToken } = c.req.valid('json');
        const file = base64ToFile(base64File, fileKey);
        const url = await uploadToS3(file, fileKey, mediaToken, c);
        return c.json({ success: true, data: { url } });
    },
);

export { ByBase64Route };
