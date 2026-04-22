import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { ActivityListResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFireflyActivityList({ indicator, size }: { indicator?: PageIndicator; size?: number } = {}) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/list', {
        cursor: indicator?.id,
        size,
    });
    const response = await fetchJson<ActivityListResponse>(url);
    const data = resolveFireflyResponseData(response);
    if (!data.list) {
        return createPageable(EMPTY_LIST, createIndicator(indicator));
    }
    return createPageable(
        data.list.map((item) => ({
            ...item,
            url: item.url.replace(/^https:\/\/(canary|staging|beta)\.firefly.social\/+/, '/'),
        })),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
