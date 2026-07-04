import type { ProfilePageSourceInURL } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';

import { getProfilePageData } from '@/app/[locale]/(normal)/profile/(profile)/[source]/[id]/getProfilePageData.js';
import { createMetadataProfileById } from '@/helpers/createMetadataProfileById.js';
import { createProfileMetadataFromProfile } from '@/helpers/createProfileMetadataFromProfile.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export async function resolveProfilePageMetadata(source: string, id: string, pathname: string): Promise<Metadata> {
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || !isProfilePageSource(resolvedSource)) {
        return createSiteMetadata(pathname);
    }

    // Shares the layout's per-request cache entry; on any fetch error fall back to the
    // metadata worker instead of failing metadata generation.
    const pageData = await runInSafeAsync(() => getProfilePageData(resolvedSource, id));
    if (pageData?.socialProfile) {
        return createProfileMetadataFromProfile(pageData.socialProfile, source as ProfilePageSourceInURL, pathname);
    }

    return createMetadataProfileById(source as ProfilePageSourceInURL, id, pathname);
}
