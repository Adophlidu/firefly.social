import urlcat from 'urlcat';

import { isZero } from '@/helpers/number.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { resolveFidFromAbnormalFarHandle } from '@/providers/farcaster/isAbnormalFarHandle.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CastsResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getLikedPostsByProfileId(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/user/timeline/farcaster/likes');
        const fid = resolveFidFromAbnormalFarHandle(profileId) || profileId;
        const response = await fireflySessionHolder.fetch<CastsResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                fids: [fid],
                size: 25,
                sourceFid: session?.profileId,
                cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
            }),
        });
        const { casts, cursor } = resolveFireflyResponseData(response);
        const posts = casts.map((cast) => formatFarcasterPostFromFirefly(cast));

        return createPageable(
            posts,
            createIndicator(indicator),
            cursor ? createNextIndicator(indicator, cursor) : undefined,
        );
    });
}
