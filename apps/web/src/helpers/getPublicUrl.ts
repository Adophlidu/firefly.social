import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { FIREFLY_S3_URL, SITE_URL } from '@/constants/static.js';

export function getPublicUrl(pathname: string) {
    return urlcat(
        SITE_URL,
        pathname,
        isServer
            ? {
                  'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
              }
            : {},
    );
}

export function getPublicS3Url(pathname: string) {
    return urlcat(FIREFLY_S3_URL, pathname);
}
