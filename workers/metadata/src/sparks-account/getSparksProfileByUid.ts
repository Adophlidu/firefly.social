import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { SparksProfileResponse } from '@/metadata/src/sparks-account/types.js';

export async function getSparksProfileByUid(uid: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/genesis/spark/profile');
    const response = await fetchJson<SparksProfileResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ uid }),
        context: c,
    });
    return response.data;
}
