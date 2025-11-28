import { isServer } from '@tanstack/react-query';
import type { StaticImageData } from 'next/image.js';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';

export function getStaticAssetSrc(asset: StaticImageData | string): string {
    return typeof asset === 'string' ? asset : isServer ? urlcat(SITE_URL, asset.src) : asset.src;
}
