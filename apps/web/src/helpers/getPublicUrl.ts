import { FIREFLY_S3_URL } from '@dimensiondev/constants/static';
import { SITE_URL } from '@dimensiondev/envs/web';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

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
