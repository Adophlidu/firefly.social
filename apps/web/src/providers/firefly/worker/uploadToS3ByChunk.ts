import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import { s3Worker } from '@dimensiondev/workers-client';
import type { MediaToken } from '@dimensiondev/workers-s3';

async function initUpload(options: { fileKey: string; contentType: string; mediaToken: MediaToken }) {
    const res = await s3Worker.s3['upload-chunk'].initiate.$post({ json: options });
    if (!res.ok) throw new Error('Failed to initiate S3 upload.');
    const json = await res.json();
    if (!json.success) throw new Error('Failed to initiate S3 upload.');
    return json.data;
}

async function uploadChunks(file: File, id: string, fileKey: string, tokenData: MediaToken) {
    const chunkSize = 5 * 1024 * 1024; // 5MB
    const buffer = await file.arrayBuffer();
    const chunks: ArrayBuffer[] = [];
    const chunksCount = Math.ceil(buffer.byteLength / chunkSize);
    const pendingUploads = new Set<{ index: number; promise: Promise<unknown> }>();
    const uploadedParts: Array<{ ETag: string; PartNumber: number }> = [];
    let index = 0;

    for (let i = 0; i < chunksCount; i += 1) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, buffer.byteLength);
        chunks.push(buffer.slice(start, end));
    }

    // Binary body + custom headers — not RPC-typed, keep as raw fetch
    while (chunks.length) {
        const chunkResponse = fetch(`${FIREFLY_WORKER_HOST}/s3/upload-chunk/chunk`, {
            method: 'POST',
            body: chunks.shift(),
            headers: {
                'X-Upload-ID': id,
                'X-Part-Number': `${index + 1}`,
                'X-File-Key': fileKey,
                'X-Media-Token': JSON.stringify(tokenData),
            },
        }).then((res) => res.json() as Promise<{ success: boolean; data: { etag: string; partNumber: number } }>);
        const task = { index: index + 1, promise: chunkResponse as Promise<unknown> };

        pendingUploads.add(task);
        task.promise.finally(() => pendingUploads.delete(task));
        (chunkResponse as Promise<{ success: boolean; data: { etag: string; partNumber: number } }>).then((res) => {
            if (!res.success) throw new Error('Failed to upload chunk.');
            uploadedParts.push({ ETag: res.data.etag, PartNumber: res.data.partNumber });
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
    mediaToken: MediaToken,
) {
    const res = await s3Worker.s3['upload-chunk'].complete.$post({
        json: { uploadId, fileKey, parts, mediaToken },
    });
    if (!res.ok) throw new Error('Failed to complete S3 upload.');
    const json = await res.json();
    if (!json.success) throw new Error('Failed to complete S3 upload.');
    return json.data.url;
}

export async function uploadToS3ByChunk(file: File, fileKey: string, mediaToken: MediaToken) {
    const initResult = await initUpload({ fileKey, contentType: file.type, mediaToken });
    const uploadedParts = await uploadChunks(file, initResult.uploadId, fileKey, mediaToken);
    return completeUpload(initResult.uploadId, fileKey, uploadedParts, mediaToken);
}
