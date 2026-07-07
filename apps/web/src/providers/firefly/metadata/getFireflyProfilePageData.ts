import { runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoint/getAllRelatedProfileInfo.js';

export const getFireflyProfilePageData = cache(async (uid: string) => {
    return runInSafeAsync(() => getAllRelatedProfileInfo({ uid }));
});
