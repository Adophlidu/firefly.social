import { Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { createFireflyProfileMetadataFromAccount } from '@/providers/firefly/metadata/createFireflyProfileMetadataFromAccount.js';
import { getFireflyProfilePageData } from '@/providers/firefly/metadata/getFireflyProfilePageData.js';

export async function getFireflyProfilePageMetadata(source: string, pathname: string): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/:source/:id/image', {
        source: resolveSourceInUrl(Source.Firefly),
        id: source,
    });

    if (!isNumericalProfileId(source)) {
        return createSiteMetadata(pathname);
    }

    const relatedProfile = await getFireflyProfilePageData(source);
    if (!relatedProfile?.account) {
        return createSiteMetadata(pathname, {
            openGraph: { images: [ogImageUrl] },
            twitter: { images: [ogImageUrl] },
        });
    }

    return createFireflyProfileMetadataFromAccount(relatedProfile.account, source, pathname);
}
