import {
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import { withErrorHandler } from '@dimensiondev/workers-shared/middlewares/withErrorHandler.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { MediaTokenSchema } from '@/s3/src/schema.js';
import {
    abortMultipartUpload,
    completeMultipartUpload,
    initiateMultipartUpload,
    uploadChunk,
} from '@/s3/src/uploadToS3ByChunk.js';

const ByChunkRoute = new Hono();

const InitiateUploadSchema = z.object({
    fileKey: z.string(),
    contentType: z.string(),
    mediaToken: MediaTokenSchema,
});

const UploadChunkSchema = z.object({
    uploadId: z.string(),
    partNumber: z.number().min(1).max(10000),
    fileKey: z.string(),
    mediaToken: MediaTokenSchema,
});

const CompleteUploadSchema = z.object({
    uploadId: z.string(),
    fileKey: z.string(),
    parts: z.array(
        z.object({
            ETag: z.string(),
            PartNumber: z.number(),
        }),
    ),
    mediaToken: MediaTokenSchema,
});

const AbortUploadSchema = z.object({
    uploadId: z.string(),
    fileKey: z.string(),
    mediaToken: MediaTokenSchema,
});

// Initiate upload
ByChunkRoute.post(
    '/initiate',
    zValidator('json', InitiateUploadSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { fileKey, contentType, mediaToken } = c.req.valid('json');

            const uploadId = await initiateMultipartUpload(fileKey, contentType, mediaToken);
            return createSuccessResponseJson({ uploadId });
        }),
);

// Upload individual chunk
ByChunkRoute.post('/chunk', async (c) =>
    withErrorHandler(async () => {
        // Get binary data from request body
        const binaryData = await c.req.arrayBuffer();

        // Get metadata from headers
        const uploadId = c.req.header('X-Upload-ID');
        const partNumber = parseInt(c.req.header('X-Part-Number') || '0');
        const fileKey = c.req.header('X-File-Key');
        const mediaTokenStr = c.req.header('X-Media-Token');

        if (!uploadId || !partNumber || !fileKey || !mediaTokenStr) {
            return c.json({ error: 'Missing required headers' }, 400);
        }

        // Validate the parsed data
        const chunk = UploadChunkSchema.parse({
            uploadId,
            partNumber,
            fileKey,
            mediaToken: parseJson(mediaTokenStr),
        });

        const etag = await uploadChunk(uploadId, partNumber, binaryData, fileKey, chunk.mediaToken);
        return createSuccessResponseJson({ etag, partNumber });
    }),
);

// Complete upload
ByChunkRoute.post(
    '/complete',
    zValidator('json', CompleteUploadSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { uploadId, fileKey, parts, mediaToken } = c.req.valid('json');

            const url = await completeMultipartUpload(uploadId, fileKey, parts, mediaToken);
            return createSuccessResponseJson({ url });
        }),
);

// Abort upload
ByChunkRoute.post(
    '/abort',
    zValidator('json', AbortUploadSchema, (result) => {
        if (!result.success) {
            return createZodErrorResponseJson(result.error, {
                status: 400,
            });
        }
    }),
    async (c) =>
        withErrorHandler(async () => {
            const { uploadId, fileKey, mediaToken } = c.req.valid('json');

            await abortMultipartUpload(uploadId, fileKey, mediaToken);
            return createSuccessResponseJson({ success: true });
        }),
);

export { ByChunkRoute };
