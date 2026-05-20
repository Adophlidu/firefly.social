import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { S3ConnectionConfig, UploadMediaTokenResponse } from '@/providers/types/Firefly.js';
import type { ResponseJson } from '@/types/utility.js';

async function initUpload(options: { fileKey: string; contentType: string; mediaToken: S3ConnectionConfig }) {
    const result = await fetchJson<ResponseJson<{ uploadId: string }>>(
        urlcat(FIREFLY_WORKER_HOST, '/s3/upload-chunk/initiate'),
        {
            method: 'POST',
            body: JSON.stringify(options),
        },
    );
    return resolveResponseData(result, 'Failed to initiate S3 upload.');
}

async function uploadChunks(file: File, id: string, fileKey: string, tokenData: S3ConnectionConfig) {
    const chunkSize = 5 * 1024 * 1024; // 5MB
    const buffer = await file.arrayBuffer();
    const chunks: ArrayBuffer[] = [];
    const chunksCount = Math.ceil(buffer.byteLength / chunkSize);
    const pendingUploads = new Set<{
        index: number;
        promise: Promise<void>;
    }>();
    const uploadedParts: Array<{
        ETag: string;
        PartNumber: number;
    }> = [];
    let index = 0;

    for (let i = 0; i < chunksCount; i += 1) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, buffer.byteLength);
        chunks.push(buffer.slice(start, end));
    }

    while (chunks.length) {
        const chunkResponse = fetch(urlcat(FIREFLY_WORKER_HOST, '/s3/upload-chunk/chunk'), {
            method: 'POST',
            body: chunks.shift(),
            headers: {
                'X-Upload-ID': id,
                'X-Part-Number': `${index + 1}`,
                'X-File-Key': fileKey,
                'X-Media-Token': JSON.stringify(tokenData),
            },
        }).then((res) => res.json());
        const task = { index: index + 1, promise: chunkResponse };

        pendingUploads.add(task);
        task.promise.finally(() => {
            pendingUploads.delete(task);
        });
        task.promise.then((res: ResponseJson<{ etag: string; partNumber: number }>) => {
            const result = resolveResponseData(res, `Failed to upload chunk.`);
            uploadedParts.push({
                ETag: result.etag,
                PartNumber: result.partNumber,
            });
        });

        index += 1;
        if (pendingUploads.size >= 4) {
            await Promise.race([...pendingUploads].map((x) => x.promise));
        }
    }

    await Promise.all([...pendingUploads].map((x) => x.promise));

    return uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
}

async function completeUpload(
    uploadId: string,
    fileKey: string,
    parts: Array<{ ETag: string; PartNumber: number }>,
    tokenData: Required<UploadMediaTokenResponse>['data'],
) {
    const completeResponse = await fetchJson<ResponseJson<{ url: string }>>(
        urlcat(FIREFLY_WORKER_HOST, '/s3/upload-chunk/complete'),
        {
            method: 'POST',
            body: JSON.stringify({
                uploadId,
                fileKey,
                parts,
                mediaToken: tokenData,
            }),
        },
    );

    return resolveResponseData(completeResponse).url;
}

export async function uploadToS3ByChunk(file: File, fileKey: string, s3Config: S3ConnectionConfig) {
    const initResult = await initUpload({
        fileKey,
        contentType: file.type,
        mediaToken: s3Config,
    });
    const uploadedParts = await uploadChunks(file, initResult.uploadId, fileKey, s3Config);
    return completeUpload(initResult.uploadId, fileKey, uploadedParts, s3Config);
}
