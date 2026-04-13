import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CastsOfChannelResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getPostsByChannelHandle(
    channelHandle: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/casts', {
            channelHandle,
            fid: session?.profileId,
            size: 20,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetch<CastsOfChannelResponse>(url);
        const data = resolveFireflyResponseData(response);
        const posts = data.casts.map((x) => formatFarcasterPostFromFirefly(x));

        return createPageable(
            posts,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    });
}
