import { type Draft, produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { type Source } from '@/constants/enum.js';
import { type Pageable } from '@/helpers/pageable.js';
import { patchNotificationQueryDataOnPost } from '@/helpers/patchNotificationQueryData.js';
import { updateQueryForPosts } from '@/helpers/updateQueryForPosts.js';
import { type Post } from '@/providers/types/SocialMedia.js';

type Patcher = (old: Draft<Post>) => void;

export type Matcher = string | ((post: Draft<Post> | null | undefined) => boolean);

/**
 * Patch all post lists, including post searching result
 */
export function patchPostQueryData(source: Source, postId: Matcher, patcher: Patcher) {
    const matcher: Matcher = typeof postId === 'string' ? (post) => post?.postId === postId : postId;

    queryClient.setQueriesData<Post>({ queryKey: ['pinned-post', source] }, (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            for (const p of [draft, draft.root, draft.commentOn]) {
                if (matcher(p)) {
                    patcher(p!);
                }
            }
        });
    });

    queryClient.setQueriesData<Post>({ queryKey: [source, 'post-detail'] }, (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            for (const p of [draft, draft.root, draft.commentOn]) {
                if (matcher(p)) {
                    patcher(p!);
                }
            }
        });
    });

    updateQueryForPosts(source, (posts) => {
        for (const post of posts) {
            for (const p of [post, post.commentOn, post.root, post.quoteOn, ...(post.threads || [])]) {
                if (matcher(p)) {
                    patcher(p!);
                }
            }
        }
    });

    queryClient.setQueriesData<Pageable<Post, undefined>>({ queryKey: [source, 'post-thread'] }, (old) => {
        if (!old?.data?.length) return old;

        return produce(old, (draft) => {
            for (const post of draft.data) {
                if (matcher(post)) {
                    patcher(post);
                }
            }
        });
    });

    patchNotificationQueryDataOnPost(source, (post) => {
        if (matcher(post)) {
            patcher(post);
        }
    });
}
