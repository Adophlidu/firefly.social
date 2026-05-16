import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { Context } from 'hono';
import type z from 'zod';

import type { MediaTokenSchema } from '@/s3/src/schema.js';

export async function uploadToS3(
    file: File,
    fileKey: string,
    mediaToken: z.infer<typeof MediaTokenSchema>,
    c: Context,
) {
    const client = new S3({
        credentials: {
            accessKeyId: mediaToken.accessKeyId,
            secretAccessKey: mediaToken.secretAccessKey,
            sessionToken: mediaToken.sessionToken,
        },
        region: mediaToken.region || 'us-west-2',
        maxAttempts: 5,
    });

    const task = new Upload({
        client,
        params: {
            Bucket: mediaToken.bucket,
            Key: fileKey,
            Body: file,
            ContentType: file.type,
        },
        partSize: 1024 * 1024 * 5, // part upload
        queueSize: 3,
        abortController: {
            abort: () => {
                // The abort will be handled by the request signal
            },
            signal: c.req.raw.signal,
        },
    });

    await task.done();

    return `https://${mediaToken.cdnHost}/${fileKey}`;
}
