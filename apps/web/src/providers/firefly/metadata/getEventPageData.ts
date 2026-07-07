import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import { cache } from 'react';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getFireflyActivityInfo } from '@/providers/firefly/activity/getFireflyActivityInfo.js';
import { createEventMetadataFromActivity } from '@/providers/firefly/metadata/createEventMetadataFromActivity.js';

export const getEventPageData = cache(async (name: string) => {
    return runInSafeAsync(() => getFireflyActivityInfo(name));
});

export async function getEventPageMetadata(name: string, pathname: string, replaceName?: string): Promise<Metadata> {
    const data = await getEventPageData(replaceName || name);
    if (!data) return createSiteMetadata(pathname);
    return createEventMetadataFromActivity(data, name, pathname);
}
