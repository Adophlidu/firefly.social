import type { Source } from '@dimensiondev/enums';
import type { Pageable } from '@dimensiondev/utils';
import { type Draft, isDraft, original, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { patchNotificationQueryDataOnPost } from '@/helpers/patchNotificationQueryData.js';
import { updateQueryForPosts } from '@/helpers/updateQueryForPosts.js';
import type { Post } from '@/providers/types/SocialMedia.js';

type Patcher = (old: Draft<Post>) => void;
type MatcherFn = (post: Draft<Post> | null | undefined) => boolean;

export type Matcher = string | MatcherFn;

function patchPostTree(
    post: Draft<Post> | null | undefined,
    matcher: MatcherFn,
    patcher: Patcher,
    visited = new WeakSet<object>(),
) {
    if (!post) return;

    const current = (isDraft(post) ? original(post) : post) as object;
    if (visited.has(current)) return;

    visited.add(current);

    if (matcher(post)) {
        patcher(post);
    }

    const children = [
        post.root,
        post.commentOn,
        post.quoteOn,
        post.mirrorOn,
        post.firstComment,
        ...(post.comments ?? []),
        ...(post.embedPosts ?? []),
        ...(post.threads ?? []),
    ];

    for (const child of children) {
        patchPostTree(child, matcher, patcher, visited);
    }
}

/**
 * Patch all post lists, including post searching result
 */
export function patchPostQueryData(source: Source, postId: Matcher, patcher: Patcher) {
    const matcher: MatcherFn = typeof postId === 'string' ? (post) => post?.postId === postId : postId;
    const createVisited = () => new WeakSet<object>();

    queryClient.setQueriesData<Post>({ queryKey: ['pinned-post', source] }, (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            patchPostTree(draft, matcher, patcher, createVisited());
        });
    });

    queryClient.setQueriesData<Post>({ queryKey: [source, 'post-detail'] }, (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            patchPostTree(draft, matcher, patcher, createVisited());
        });
    });

    queryClient.setQueriesData<Post>({ queryKey: [source, 'post-detail', 'actions'] }, (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            patchPostTree(draft, matcher, patcher, createVisited());
        });
    });

    updateQueryForPosts(source, (posts) => {
        const visited = createVisited();
        for (const post of posts) {
            patchPostTree(post, matcher, patcher, visited);
        }
    });

    queryClient.setQueriesData<Pageable<Post, undefined>>({ queryKey: [source, 'post-thread'] }, (old) => {
        if (!old?.data?.length) return old;

        return produce(old, (draft) => {
            const visited = createVisited();
            for (const post of draft.data) {
                patchPostTree(post, matcher, patcher, visited);
            }
        });
    });

    patchNotificationQueryDataOnPost(source, (post) => {
        patchPostTree(post, matcher, patcher, createVisited());
    });
}
