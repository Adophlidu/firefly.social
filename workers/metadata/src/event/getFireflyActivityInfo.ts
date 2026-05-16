import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { GetActivityInfoResponse } from '@/metadata/src/event/types.js';

export async function getFireflyActivityInfo(name: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/activity/info', {
        name,
    });
    const response = await fetchJson<GetActivityInfoResponse>(url, {
        context: c,
    });
    return resolveFireflyResponseData(response);
}
