import type { ProfilePageSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { createProfileMetadataFromProfile } from '@/providers/firefly/metadata/createProfileMetadataFromProfile.js';
import { createWalletProfileMetadataFromProfile } from '@/providers/firefly/metadata/createWalletProfileMetadataFromProfile.js';
import { getProfilePageData } from '@/providers/firefly/metadata/getProfilePageData.js';
import { getSocialProfilePageMetadata } from '@/providers/firefly/metadata/getSocialProfilePageMetadata.js';
import { getWalletProfilePageMetadata } from '@/providers/firefly/metadata/getWalletProfilePageMetadata.js';

export async function getProfilePageMetadata(source: string, id: string, pathname: string): Promise<Metadata> {
    const resolvedSource = resolveSourceFromUrlNoFallback(source);
    if (!resolvedSource || !isProfilePageSource(resolvedSource)) {
        return createSiteMetadata(pathname);
    }

    // Shares the layout's per-request cache entry; on fetch error fall back to a direct wallet lookup.
    const pageData = await runInSafeAsync(() => getProfilePageData(resolvedSource, id));
    if (pageData?.socialProfile) {
        return createProfileMetadataFromProfile(pageData.socialProfile, source as ProfilePageSourceInURL, pathname);
    }
    if (pageData?.walletProfile) {
        return createWalletProfileMetadataFromProfile(pageData.walletProfile, id, pathname);
    }

    if (source === SourceInURL.Wallet || source === SourceInURL.WalletMix) {
        return getWalletProfilePageMetadata(id, pathname);
    }

    return getSocialProfilePageMetadata(source as ProfilePageSourceInURL, id, pathname);
}
