import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { blobToBase64 } from '@/helpers/blobToBase64.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { S3ConnectionConfig } from '@/providers/types/Firefly.js';
import type { ResponseJson } from '@/types/utility.js';

export async function uploadToS3ByBase64(file: File, fileKey: string, s3Config: S3ConnectionConfig) {
    const response = await fetchJson<ResponseJson<{ url: string }>>(urlcat(FIREFLY_WORKER_HOST, '/s3/upload/upload'), {
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
