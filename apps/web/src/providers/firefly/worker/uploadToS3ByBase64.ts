import { s3Worker } from '@dimensiondev/workers-client';
import type { MediaToken } from '@dimensiondev/workers-s3';

import { blobToBase64 } from '@/helpers/blobToBase64.js';

export async function uploadToS3ByBase64(file: File, fileKey: string, mediaToken: MediaToken) {
    const res = await s3Worker.s3.upload.upload.$post({
        json: { file: await blobToBase64(file), fileKey, mediaToken },
    });
    if (!res.ok) throw new Error('Failed to upload file to S3.');
    const json = await res.json();
    if (!json.success) throw new Error('Failed to upload file to S3.');
    return json.data.url;
}
