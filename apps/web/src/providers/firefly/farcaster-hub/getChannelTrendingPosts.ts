import { Source } from '@dimensiondev/enums';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CastsOfChannelResponse } from '@/providers/types/Firefly.js';
import type { Channel, Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getChannelTrendingPosts(
    channel: Channel,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const profile = getCurrentProfileFromStorage(Source.Farcaster);
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/trending_casts', {
            channelUrl: channel.url,
            channelHandle: channel.id,
            size: 20,
            cursor: indicator?.id,
            fid: session?.profileId,
            handle: profile?.handle,
        });
        const response = await fireflySessionHolder.fetch<CastsOfChannelResponse>(url);
        const data = resolveFireflyResponseData(response);
        const posts = data.casts.map((x) => formatFarcasterPostFromFirefly(x));

        return createPageable(
            posts,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    });
}
