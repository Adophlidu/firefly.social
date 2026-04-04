import urlcat from 'urlcat';

import { type SocialSource, type SocialSourceInURL } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPostPublishInfoFromFirefly(source: SocialSource, postIds: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/ff_post/from_firefly');
    const response = await fireflySessionHolder.fetch<
        Response<{
            platform: SocialSourceInURL;
            posts: Record<string, boolean>;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            platform: resolveSocialSourceInUrl(source),
            post_ids: postIds,
        }),
    });
    return resolveFireflyResponseData(response);
}
