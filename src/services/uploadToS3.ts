import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST, SUFFIX_NAMES } from '@/constants/index.js';
import { blobToBase64 } from '@/helpers/blobToBase64.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { memoizePromiseWithTime } from '@/helpers/memoizePromise.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { S3ConnectionConfig, UploadMediaTokenResponse } from '@/providers/types/Firefly.js';
import { uploadToS3ByChunk } from '@/services/uploadToS3ByChunk.js';
import { settings } from '@/settings/index.js';
import type { ResponseJson } from '@/types/utility.js';

const FIVE_MB = 5 * 1024 * 1024;
const uploadedCache = new WeakMap<File, string | Promise<string>>();

const getS3ConnectionConfig = memoizePromiseWithTime(
    async function getS3ConnectionConfig() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/uploadMediaToken');
        const response = await fetchJson<UploadMediaTokenResponse>(url);
        return resolveFireflyResponseData(response);
    },
    () => 'getS3ConnectionConfig',
    // https://github.com/DimensionDev/Mask-X-Backend/blob/develop/src/farcaster-hub/farcaster-hub.service.ts
    { cacheTime: 60 * 10 }, // 10 minutes
);

async function uploadToS3ByBase64(file: File, fileKey: string, s3Config: S3ConnectionConfig) {
    const response = await fetchJson<ResponseJson<{ url: string }>>(urlcat(FIREFLY_WORKER_HOST, '/s3/upload'), {
        method: 'POST',
        body: JSON.stringify({
            file: await blobToBase64(file),
            fileKey,
            mediaToken: s3Config,
        }),
    });

    const { url } = resolveResponseData(response);
    return url;
}

async function uploadToDirectory(
    file: File,
    directory: string,
    nameGenerator = (file: File) => `${crypto.randomUUID()}.${SUFFIX_NAMES[file.type as keyof typeof SUFFIX_NAMES]}`,
): Promise<string> {
    const hit = uploadedCache.get(file);
    if (typeof hit === 'string' || hit instanceof Promise) return hit;

    const promise = new Promise<string>(async (resolve, reject) => {
        try {
            const s3Config = await getS3ConnectionConfig();
            const fileKey = `${directory}/${nameGenerator(file)}`;

            const url =
                file.size <= FIVE_MB
                    ? await uploadToS3ByBase64(file, fileKey, s3Config)
                    : await uploadToS3ByChunk(file, fileKey, s3Config);

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
