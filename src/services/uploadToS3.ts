import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST, SUFFIX_NAMES } from '@/constants/index.js';
import { blobToBase64 } from '@/helpers/blobToBase64.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { memoizePromiseWithTime } from '@/helpers/memoizePromise.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { UploadMediaTokenResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';
import type { ResponseJson } from '@/types/utility.js';

type UploadResponse = ResponseJson<{
    url: string;
}>;

const uploadedCache = new WeakMap<File, string | Promise<string>>();

const getS3UploadMediaToken = memoizePromiseWithTime(
    async function getS3UploadMediaToken() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/uploadMediaToken');
        const response = await fetchJson<UploadMediaTokenResponse>(url);
        return resolveFireflyResponseData(response);
    },
    () => 'getS3UploadMediaToken',
    // https://github.com/DimensionDev/Mask-X-Backend/blob/develop/src/farcaster-hub/farcaster-hub.service.ts
    { cacheTime: 60 * 10 }, // 10 minutes
);

async function uploadToDirectory(
    file: File,
    directory: string,
    nameGenerator = (file: File) => `${crypto.randomUUID()}.${SUFFIX_NAMES[file.type as keyof typeof SUFFIX_NAMES]}`,
): Promise<string> {
    const hit = uploadedCache.get(file);
    if (typeof hit === 'string' || hit instanceof Promise) return hit;

    const promise = new Promise<string>(async (resolve, reject) => {
        try {
            const mediaToken = await getS3UploadMediaToken();
            const response = await fetchJson<UploadResponse>(urlcat(FIREFLY_WORKER_HOST, '/s3/upload'), {
                method: 'POST',
                body: JSON.stringify({
                    file: await blobToBase64(file),
                    fileKey: `${directory}/${nameGenerator(file)}`,
                    mediaToken,
                }),
            });

            const { url } = resolveResponseData(response);

            uploadedCache.set(file, url);
            resolve(url);
        } catch (err) {
            // So that we can retry uploading
            uploadedCache.delete(file);
            reject(err);
        }
    });

    uploadedCache.set(file, promise);

    return promise;
}

export const uploadToS3 = (file: File, directory = 'web') => uploadToDirectory(file, directory.toLowerCase());
