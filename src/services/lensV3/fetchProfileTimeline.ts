import {
    evmAddress,
    type Paginated,
    TimelineEventItemType,
    type TimelineItem,
    TimelineQuery,
    type TimelineRequest,
} from '@lens-protocol/client';
import { compact } from 'lodash-es';

import { lensApolloClient } from '@/configs/lensApolloClient.js';
import { formatLensPostByFeedV3 } from '@/helpers/formatLensPost.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';

export async function fetchProfileTimeline(profileId: string, indicator?: PageIndicator) {
    const result = await lensApolloClient.query<
        {
            value: Paginated<TimelineItem>;
        },
        {
            request: TimelineRequest;
        }
    >({
        query: TimelineQuery,
        variables: {
            request: {
                cursor: ensureCursor(indicator),
                filter: {
                    eventType: [
                        TimelineEventItemType.Post,
                        TimelineEventItemType.Comment,
                        TimelineEventItemType.Repost,
                    ],
                },
                account: evmAddress(profileId),
            },
        },
        errorPolicy: 'all',
        fetchPolicy: 'no-cache',
    });

    if (Array.isArray(result?.data?.value?.items)) {
        const { items, pageInfo } = result.data.value;
        const posts = compact(await Promise.all(items.map(formatLensPostByFeedV3)));
        return createPageable(
            posts.filter((post) => !post.author.viewerContext?.blocking && !post.hasReported),
            createIndicator(indicator),
            pageInfo?.next ? createNextIndicator(indicator, pageInfo.next) : undefined,
        );
    }

    if (result.errors?.length) {
        throw result.errors[0];
    }
    if (result.error) {
        throw result.error;
    }
    return createPageable([], createIndicator(indicator), undefined);
}
