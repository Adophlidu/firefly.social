import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { SITE_DESCRIPTION, SITE_URL } from '@/constants/index.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getFireflyProfileURL } from '@/helpers/getFireflyProfileURL.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export async function createMetadataProfileByFireflyUid(uid: string) {
    const relatedProfile = await runInSafeAsync(() => FireflyEndpointProvider.getAllRelatedProfileInfo({ uid }));
    if (!relatedProfile?.account) return createSiteMetadata();
    const account = relatedProfile.account;

    const images = [
        {
            url: urlcat(SITE_URL, 'api/og/profile/:source/:id/image', {
                source: resolveSourceInUrl(Source.Firefly),
                id: uid,
            }),
        },
    ];

    const title = createPageTitleOG(`${account.displayName || 'Firefly User'}`);
    const description = SITE_DESCRIPTION;

    return createSiteMetadata({
        title,
        description,
        openGraph: {
            type: 'profile',
            url: urlcat(SITE_URL, getFireflyProfileURL(uid)),
            title,
            description,
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
