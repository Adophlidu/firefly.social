import type { UploadMediaV1Params } from 'twitter-api-v2';

import { MAX_SIZE_PER_CHUNK } from '@/constants/static.js';
import { getVideoDuration } from '@/helpers/getVideoDuration.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { uploadToTwitterWithChunksV2 } from '@/providers/twitter/uploadToTwitterWithChunksV2.js';
import type { TwitterMediaResponse } from '@/types/twitter.js';

export async function uploadToTwitter(
    uploads: Array<{ file: File; options?: Partial<UploadMediaV1Params> }>,
): Promise<TwitterMediaResponse[]> {
    const medias = await Promise.all(
        uploads.map(async ({ file, options = {} }) => {
            if (file.size > MAX_SIZE_PER_CHUNK) {
                return uploadToTwitterWithChunksV2(file, undefined, options);
            }

            const formData = new FormData();
            formData.append('file', file);

            const result = await twitterSessionHolder.fetch<{ data?: { media_id: string } }>(
                '/api/twitter/uploadMedia/v2',
                {
                    method: 'POST',
                    body: formData,
                },
            );
            return result.data;
        }),
    );
    return medias.map((x, i) => {
        if (!x?.media_id) {
            throw new Error('Failed to upload media to Twitter, no media_id returned');
        }

        return {
            file: uploads[i].file,
            media_id: x.media_id,
            media_id_string: x.media_id,
        };
    });
}

export async function uploadVideoToTwitter(file: File): Promise<TwitterMediaResponse[]> {
    const duration = await getVideoDuration(file);

    return uploadToTwitter([{ file, options: { longVideo: duration > 140 } }]);
}
