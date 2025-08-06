import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { SITE_DESCRIPTION, SITE_URL } from '@/constants/index.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getFireflyProfileURL } from '@/helpers/getFireflyProfileURL.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/getAllRelatedProfileInfo.js';

export async function createMetadataProfileByFireflyUid(pathname: string, uid: string) {
    const relatedProfile = await runInSafeAsync(() => getAllRelatedProfileInfo({ uid }));
    if (!relatedProfile?.account) return createSiteMetadata(pathname);

    const images = [
        {
            url: urlcat(SITE_URL, 'api/og/profile/:source/:id/image', {
                source: resolveSourceInUrl(Source.Firefly),
                id: uid,
            }),
        },
    ];

    const title = createPageTitleOG(`${relatedProfile.account.displayName || 'Firefly User'}`);
    const description = SITE_DESCRIPTION;

    return createSiteMetadata(pathname, {
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
