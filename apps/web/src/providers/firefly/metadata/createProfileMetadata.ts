import type { ProfilePageSourceInURL } from '@dimensiondev/enums';
import type { Metadata } from 'next';

import { getSocialProfilePageMetadata } from '@/helpers/getSocialProfilePageData.js';

export async function createProfileMetadata(source: string, handle: string, pathname: string): Promise<Metadata> {
    return getSocialProfilePageMetadata(source as ProfilePageSourceInURL, handle, pathname);
}
