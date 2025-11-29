import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';

export function getPublicSvgUrl(file: string) {
    return urlcat(SITE_URL, `/svg/${file}`);
}
