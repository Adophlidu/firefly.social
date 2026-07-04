import { createIndicator, runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { type ActivityListInitialData, buildActivityListInitialData } from '@/helpers/buildActivityListInitialData.js';
import { getFireflyActivityList } from '@/providers/firefly/activity/getFireflyActivityList.js';

// Parent `(event)/layout` generateMetadata uses a static title only — this cached fetch is
// shared when page.tsx and generateMetadata both need the activity list in the same request.
export const getEventsListPageData = cache(async (): Promise<ActivityListInitialData | undefined> => {
    const page = await runInSafeAsync(() => getFireflyActivityList({ indicator: createIndicator(undefined, '') }));
    if (!page?.data.length) return undefined;
    return buildActivityListInitialData(page);
});
