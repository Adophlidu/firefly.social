import { parseUrl } from '@firefly/utils';

import { FIREFLY_S3_DOMAIN } from '@/constants/index.js';

export function resolveSizeFromS3Url(s3Url: string) {
    const u = parseUrl(s3Url);
    if (u?.origin !== FIREFLY_S3_DOMAIN) return null;

    const width = Number.parseInt(u.searchParams.get('w') || '', 10);
    const height = Number.parseInt(u.searchParams.get('h') || '', 10);
    if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) return null;

    return { width, height };
}
