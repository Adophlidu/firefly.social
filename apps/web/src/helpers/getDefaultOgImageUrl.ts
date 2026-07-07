import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

export function getDefaultOgImageUrl() {
    return urlcat(SITE_URL, '/api/og/site/image');
}
