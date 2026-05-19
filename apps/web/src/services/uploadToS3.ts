import { SUFFIX_NAMES } from '@dimensiondev/constants/computed';

import { memoizePromiseWithTime } from '@/helpers/memoizePromise.js';
import { uploadMediaToken } from '@/providers/firefly/farcaster-hub/uploadMediaToken.js';
import { uploadToS3ByBase64 } from '@/providers/firefly/worker/uploadToS3ByBase64.js';
import { uploadToS3ByChunk } from '@/providers/firefly/worker/uploadToS3ByChunk.js';

const FIVE_MB = 5 * 1024 * 1024;
const uploadedCache = new WeakMap<File, string | Promise<string>>();

const getS3ConnectionConfig = memoizePromiseWithTime(
    uploadMediaToken,
    () => 'getS3ConnectionConfig',
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
