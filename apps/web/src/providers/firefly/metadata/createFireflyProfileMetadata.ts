import type { Metadata } from 'next';

import { getFireflyProfilePageMetadata } from '@/helpers/getFireflyProfilePageMetadata.js';

export async function createFireflyProfileMetadata(source: string, pathname: string): Promise<Metadata> {
    return getFireflyProfilePageMetadata(source, pathname);
}
