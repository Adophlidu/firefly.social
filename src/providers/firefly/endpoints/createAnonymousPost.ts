import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CreateAnonymousPostOptions, CreateAnonymousPostResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function createAnonymousPost(options: CreateAnonymousPostOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/post/anonymous');
    const response = await fireflySessionHolder.fetch<CreateAnonymousPostResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    return resolveFireflyResponseData(response);
}
