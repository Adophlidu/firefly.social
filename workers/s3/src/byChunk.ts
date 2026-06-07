import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
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

const ByChunkRoute = new Hono()
    .post(
        '/initiate',
        zValidator('json', InitiateUploadSchema, (result, c) => {
            if (!result.success) {
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
            }
            return;
        }),
        async (c) => {
            const { fileKey, contentType, mediaToken } = c.req.valid('json');
            const uploadId = await initiateMultipartUpload(fileKey, contentType, mediaToken);
            return c.json({ success: true, data: { uploadId } });
        },
    )
    // Upload individual chunk — raw binary body with metadata in headers; not RPC-typed
    .post('/chunk', async (c) => {
        const binaryData = await c.req.arrayBuffer();

        const uploadId = c.req.header('X-Upload-ID');
        const partNumber = parseInt(c.req.header('X-Part-Number') || '0');
        const fileKey = c.req.header('X-File-Key');
        const mediaTokenStr = c.req.header('X-Media-Token');

        if (!uploadId || !partNumber || !fileKey || !mediaTokenStr) {
            return c.json({ success: false, error: { code: 40001, message: 'Missing required headers' } }, 400);
        }

        const chunk = UploadChunkSchema.parse({
            uploadId,
            partNumber,
            fileKey,
            mediaToken: parseJson(mediaTokenStr),
        });

        const etag = await uploadChunk(uploadId, partNumber, binaryData, fileKey, chunk.mediaToken);
        return c.json({ success: true, data: { etag, partNumber } });
    })
    .post(
        '/complete',
        zValidator('json', CompleteUploadSchema, (result, c) => {
            if (!result.success) {
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
            }
            return;
        }),
        async (c) => {
            const { uploadId, fileKey, parts, mediaToken } = c.req.valid('json');
            const url = await completeMultipartUpload(uploadId, fileKey, parts, mediaToken);
            return c.json({ success: true, data: { url } });
        },
    )
    .post(
        '/abort',
        zValidator('json', AbortUploadSchema, (result, c) => {
            if (!result.success) {
                return c.json({ success: false, error: { code: 40001, message: result.error.message } }, 400);
            }
            return;
        }),
        async (c) => {
            const { uploadId, fileKey, mediaToken } = c.req.valid('json');
            await abortMultipartUpload(uploadId, fileKey, mediaToken);
            return c.json({ success: true, data: { success: true } });
        },
    );

export { ByChunkRoute };
