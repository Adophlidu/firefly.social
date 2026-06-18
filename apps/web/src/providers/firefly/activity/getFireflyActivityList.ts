import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { ActivityListResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/** Cache tag for the activity list; use with revalidateTag for on-demand invalidation. */
const FIREFLY_ACTIVITY_LIST_TAG = 'firefly-activity-list';

export async function getFireflyActivityList({
    indicator,
    size,
}: {
    indicator?: PageIndicator;
    size?: number;
} = {}) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/list', {
        cursor: indicator?.id,
        size,
    });
    const response = await fetchJson<ActivityListResponse>(url, {
        signal: isServer ? AbortSignal.timeout(5000) : undefined,
        next: isServer ? { revalidate: 3600, tags: [FIREFLY_ACTIVITY_LIST_TAG] } : undefined,
    });
    const data = resolveFireflyResponseData(response);
    if (!data.list?.length) return createPageable(EMPTY_LIST, createIndicator(indicator));

    return createPageable(
        data.list.map((item) => ({
            ...item,
            url: item.url.replace(/^https:\/\/(canary|staging|beta)\.firefly.social\/+/, '/'),
        })),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
