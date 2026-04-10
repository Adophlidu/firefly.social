import { runInSafeAsync } from '@dimensiondev/utils';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { patchPostsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { formatTwitterPostFromNitter } from '@/providers/nitter/formatTwitterPostFromNitter.js';
import { withReplyPostsToTimeline } from '@/providers/nitter/withReplyPostsToTimeline.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { type Pagination, type Tweet } from '@/providers/types/Nitter.js';

export async function withReplyPostsToTimelineWithPagination(
    timeline: Tweet[],
    pagination: Pagination,
    indicator?: PageIndicator,
) {
    timeline = timeline.flat();
    if (twitterSessionHolder.session) {
        const data = await runInSafeAsync(() => withReplyPostsToTimeline(timeline));
        if (data) {
            return createPageable(
                await patchPostsClientToFirefly(data),
                createIndicator(indicator),
                pagination.bottom ? createNextIndicator(indicator, pagination.bottom) : undefined,
            );
        }
    }
    const data = await patchPostsClientToFirefly(
        timeline.map((tweet) => formatTwitterPostFromNitter(tweet, { base: { commentLoadable: true } })),
    );
    return createPageable(
        data,
        createIndicator(indicator),
        pagination.bottom ? createNextIndicator(indicator, pagination.bottom) : undefined,
    );
}
