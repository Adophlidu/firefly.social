import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    S3,
    UploadPartCommand,
} from '@aws-sdk/client-s3';
import type z from 'zod';

import type { MediaTokenSchema } from '@/s3/src/schema.js';

function createS3Client(mediaToken: z.infer<typeof MediaTokenSchema>) {
    return new S3({
        credentials: {
            accessKeyId: mediaToken.accessKeyId,
            secretAccessKey: mediaToken.secretAccessKey,
            sessionToken: mediaToken.sessionToken,
        },
        region: mediaToken.region || 'us-west-2',
        maxAttempts: 5,
    });
}

export async function initiateMultipartUpload(
    fileKey: string,
    contentType: string,
    mediaToken: z.infer<typeof MediaTokenSchema>,
): Promise<string> {
    const client = createS3Client(mediaToken);

    const command = new CreateMultipartUploadCommand({
        Bucket: mediaToken.bucket,
        Key: fileKey,
        ContentType: contentType,
    });

    const response = await client.send(command);

    if (!response.UploadId) {
        throw new Error('Failed to initiate multipart upload');
    }

    return response.UploadId;
}

export async function uploadChunk(
    uploadId: string,
    partNumber: number,
    chunkData: ArrayBuffer, // binary chunk data
    fileKey: string,
    mediaToken: z.infer<typeof MediaTokenSchema>,
): Promise<string> {
    const client = createS3Client(mediaToken);

    const command = new UploadPartCommand({
        Bucket: mediaToken.bucket,
        Key: fileKey,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: new Uint8Array(chunkData),
    });

    const response = await client.send(command);

    if (!response.ETag) {
        throw new Error(`Failed to upload chunk ${partNumber}`);
    }

    return response.ETag;
}

export async function completeMultipartUpload(
    uploadId: string,
    fileKey: string,
    parts: Array<{ ETag: string; PartNumber: number }>,
    mediaToken: z.infer<typeof MediaTokenSchema>,
): Promise<string> {
    const client = createS3Client(mediaToken);

    const command = new CompleteMultipartUploadCommand({
        Bucket: mediaToken.bucket,
        Key: fileKey,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts.map((part) => ({
                ETag: part.ETag,
                PartNumber: part.PartNumber,
            })),
        },
    });

    await client.send(command);

    return `https://${mediaToken.cdnHost}/${fileKey}`;
}

export async function abortMultipartUpload(
    uploadId: string,
    fileKey: string,
    mediaToken: z.infer<typeof MediaTokenSchema>,
): Promise<void> {
    const client = createS3Client(mediaToken);

    const command = new AbortMultipartUploadCommand({
        Bucket: mediaToken.bucket,
        Key: fileKey,
        UploadId: uploadId,
    });

    await client.send(command);
}
