import type { PredictionPlatform } from '@dimensiondev/enums';
import type { Metadata } from 'next';

import { getPredictionEventPageMetadata } from '@/helpers/getPredictionEventPageMetadata.js';

export async function createPredictionEventMetadata(
    id: string,
    platform: PredictionPlatform,
    pathname: string,
    type?: 'multi' | string,
    locale?: string,
): Promise<Metadata> {
    return getPredictionEventPageMetadata({
        id,
        isMutil: type === 'multi',
        locale,
        platform,
        pathname,
        type,
    });
}
