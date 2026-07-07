import type { PredictionPlatform } from '@dimensiondev/enums';
import type { Metadata } from 'next';

import { getPredictionProfilePageMetadata } from '@/helpers/getPredictionProfilePageMetadata.js';

export async function createPredictionProfileMetadata(
    address: string,
    platform: PredictionPlatform,
    pathname: string,
): Promise<Metadata> {
    return getPredictionProfilePageMetadata(address, platform, pathname);
}
