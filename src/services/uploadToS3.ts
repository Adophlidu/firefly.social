import urlcat from 'urlcat';

import { SUFFIX_NAMES } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { UploadMediaTokenResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

const uploadedCache = new WeakMap<File, string | Promise<string>>();

async function getS3UploadMediaToken() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/uploadMediaToken');
    const response = await fetchJson<UploadMediaTokenResponse>(url);
    return resolveFireflyResponseData(response);
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
            // Dynamically import S3 and Upload modules
            const [S3, Upload] = await Promise.all([
                import('@aws-sdk/client-s3').then((x) => x.S3),
                import('@aws-sdk/lib-storage').then((x) => x.Upload),
            ]);

            const mediaToken = await getS3UploadMediaToken();
            const client = new S3({
                credentials: {
                    accessKeyId: mediaToken.accessKeyId,
                    secretAccessKey: mediaToken.secretAccessKey,
                    sessionToken: mediaToken.sessionToken,
                },
                region: mediaToken.region || 'us-west-2',
                maxAttempts: 5,
            });

            const params = {
                Bucket: mediaToken.bucket,
                Key: `${directory}/${nameGenerator(file)}`,
                Body: file,
                ContentType: file.type,
            };
            const task = new Upload({
                client,
                params,
                partSize: 1024 * 1024 * 5, // part upload
                queueSize: 3,
            });

            await task.done();

            const url = `https://${mediaToken.cdnHost}/${params.Key}`;
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
