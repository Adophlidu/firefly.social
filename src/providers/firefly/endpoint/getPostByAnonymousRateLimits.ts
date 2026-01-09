import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type PostByAnonymousRateLimitsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPostByAnonymousRateLimits() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/post/anonymous/availability');
    const response = await fireflySessionHolder.fetch<PostByAnonymousRateLimitsResponse>(url);

    return resolveFireflyResponseData(response);
}
