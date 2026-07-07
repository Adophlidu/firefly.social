import { runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { getFireflyActivityInfo } from '@/providers/firefly/activity/getFireflyActivityInfo.js';

export const getEventPageData = cache(async (name: string) => {
    return runInSafeAsync(() => getFireflyActivityInfo(name));
});
