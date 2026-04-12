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
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CommentsResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getCommentsById(
    postId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/comments', {
            hash: postId,
            size: 25,
            fid: session?.profileId,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
            priority: 'high',
        });
        const response = await fireflySessionHolder.fetch<CommentsResponse>(url);
        const { comments, cursor } = resolveFireflyResponseData(response);
        const posts = comments.map((item) => formatFarcasterPostFromFirefly(item));

        return createPageable(
            posts,
            createIndicator(indicator),
            cursor ? createNextIndicator(indicator, cursor) : undefined,
        );
    });
}
