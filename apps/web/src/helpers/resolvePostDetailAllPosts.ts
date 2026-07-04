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

    const merged = [...threadPosts, detailPost].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    if (merged.length >= MIN_POST_SIZE_PER_THREAD) return merged;
    return EMPTY_LIST;
}
