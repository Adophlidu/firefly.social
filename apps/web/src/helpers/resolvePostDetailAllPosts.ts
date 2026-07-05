import { EMPTY_LIST } from '@dimensiondev/constants';
import { MIN_POST_SIZE_PER_THREAD } from '@dimensiondev/constants/static';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';

import type { Post } from '@/providers/types/SocialMedia.js';

/** Rebuild thread order after post-thread cache drops the detail post (avoids duplicate dehydration). */
export function resolvePostDetailAllPosts(
    detailPost: Post,
    thread: Pageable<Post, PageIndicator | undefined> | undefined,
): Post[] {
    const threadPosts = thread?.data ?? EMPTY_LIST;
    if (threadPosts.length === 0) return EMPTY_LIST;

    // Posts can lack a timestamp (e.g. some Farcaster casts); coercing that to 0 would sort them
    // ahead of the thread root. Leave relative order untouched when either side is missing one.
    const merged = [...threadPosts, detailPost].sort((a, b) => {
        if (typeof a.timestamp !== 'number' || typeof b.timestamp !== 'number') return 0;
        return a.timestamp - b.timestamp;
    });
    if (merged.length >= MIN_POST_SIZE_PER_THREAD) return merged;
    return EMPTY_LIST;
}
