import { delay, safeUnreachable } from '@dimensiondev/utils';
import type { UploadMediaV1Params } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { FileMimeType, UploadMediaStatus } from '@/constants/enum.js';
import { TimeoutError, UnreachableError } from '@/constants/error.js';
import { getTwitterMediaCategory } from '@/providers/twitter/getTwitterMediaCategory.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { FinishUploadResponseV2, GetUploadStatusResponseV2, UploadMediaResponseV2 } from '@/types/twitter.js';

async function waitForUpload(media_id: string, retry = 30) {
    const { data } = await twitterSessionHolder.fetch<{ data: GetUploadStatusResponseV2 }>(
        urlcat('/api/twitter/uploadMedia/chunk/v2', { media_id }),
    );

    switch (data.processing_info?.state) {
        case UploadMediaStatus.Failed:
            throw new Error(data.processing_info.error?.message || 'Failed to upload on X');
        case UploadMediaStatus.Success:
            return data;
        case UploadMediaStatus.Pending:
        case UploadMediaStatus.Uploading:
            if (retry <= 0) {
                throw new TimeoutError('Timeout waiting for upload');
            }
            const seconds = data.processing_info.check_after_secs || 1;
            await delay(1000 * seconds);
            return waitForUpload(media_id, retry - 1);
        default:
            safeUnreachable(data.processing_info?.state);
            throw new UnreachableError('UploadMediaStatus', data.processing_info?.state);
    }
}

async function uploadChunks(chunks: Blob[], mediaId: string) {
    const copied = chunks.slice();
    const pendingUploads = new Set<Promise<void>>();
    let index = 0;

    while (copied.length) {
        const formData = new FormData();
        formData.append('media', copied.shift()!);

        const upload = twitterSessionHolder.fetch<void>(
            urlcat('/api/twitter/uploadMedia/chunk/v2/append', {
                media_id: mediaId,
                segment_index: index,
            }),
            {
                method: 'POST',
                body: formData,
            },
        );

        pendingUploads.add(upload);
        upload.finally(() => {
            pendingUploads.delete(upload);
        });

        index += 1;

        if (pendingUploads.size >= 4) {
            await Promise.race([...pendingUploads]);
        }
    }

    await Promise.all([...pendingUploads]);
}

export async function uploadToTwitterWithChunksV2(
    file: File,
    chunkSize = 3 * 1024 * 1024,
    options?: Partial<UploadMediaV1Params>,
) {
    const chunks = [];
    const fileSize = file.size;
    for (let i = 0; i < fileSize; i += chunkSize) {
        chunks.push(file.slice(i, Math.min(i + chunkSize, fileSize)));
    }

    // Init upload
    const { data: mediaInfo } = await twitterSessionHolder.fetch<{ data: UploadMediaResponseV2 }>(
        urlcat('/api/twitter/uploadMedia/chunk/v2/init', {
            total_bytes: fileSize,
            media_type: file.type,
            media_category: getTwitterMediaCategory(file.type as FileMimeType, 'tweet', options),
        }),
        { method: 'POST' },
    );

    // upload chunks
    await uploadChunks(chunks, mediaInfo.id);

    // Finish upload
    const result = await twitterSessionHolder.fetch<{ data: FinishUploadResponseV2 }>(
        urlcat('/api/twitter/uploadMedia/chunk/v2', {
            media_id: mediaInfo.id,
        }),
        { method: 'POST' },
    );
    const { data } = result;
    if (data?.processing_info?.check_after_secs > 0) {
        await delay(data.processing_info.check_after_secs);
    }

    // small size media will be success immediately, no need to wait
    if (data?.processing_info && data.processing_info.state !== UploadMediaStatus.Success) {
        await waitForUpload(mediaInfo.id);
    }

    return {
        media_id: mediaInfo.id,
        media_id_string: mediaInfo.id,
        size: file.size,
        expires_after_secs: mediaInfo.expires_after_secs,
    };
}
