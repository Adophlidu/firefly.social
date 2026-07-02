import { Source } from '@dimensiondev/enums';
import { NotFoundError } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/configs/queryClient.js';
import { mergePostDetailCache } from '@/helpers/mergePostDetailCache.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import type { Post } from '@/providers/types/SocialMedia.js';

/**
 * Re-fetch the post with the user's session on the detail page so action
 * buttons (comment, mirror, etc.) see authenticated gates like `canComment`.
 * The SSR/hydrated post can report `canComment: true` before this resolves.
 */
export function useDetailPostForActions(initialPost: Post, enabled = true) {
    const asyncStatus = useAsyncStatus(initialPost.source);
    const postId = initialPost.postId;

    return useQuery({
        queryKey: [initialPost.source, 'post-detail', 'actions', initialPost.postId, asyncStatus],
        queryFn: async () => {
            // React Query v5 rejects an `undefined` queryFn result ("Query data
            // cannot be undefined"), so every branch falls back to `initialPost`
            // rather than returning nothing — callers keep the hydrated post and
            // the query never lands in an error state.
            if (!postId) return initialPost;

            try {
                const provider = resolveSocialMediaProvider(initialPost.source);
                const post = await provider.getPostById(postId);
                if (!post) return initialPost;
                if (initialPost.source === Source.Twitter) {
                    queryClient.setQueryData(
                        [initialPost.source, 'post-detail', initialPost.postId],
                        (oldData: Post | undefined) => mergePostDetailCache(post, oldData),
                    );
                }

                return post;
            } catch (error) {
                if (error instanceof NotFoundError) return initialPost;
                throw error;
            }
        },
        enabled: enabled && !!postId,
    });
}
