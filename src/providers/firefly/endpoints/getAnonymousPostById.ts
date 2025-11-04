import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetAnonymousPostResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getAnonymousPostById(id: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/post/anonymous/post', {
        postId: id,
    });
    const response = await fireflySessionHolder.fetch<GetAnonymousPostResponse>(url);
    return resolveFireflyResponseData(response);
}
