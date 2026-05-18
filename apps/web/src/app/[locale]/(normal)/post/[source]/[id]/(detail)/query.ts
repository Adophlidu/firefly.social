import { Source } from '@dimensiondev/enums';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { NotFoundError } from '@dimensiondev/utils';

import type { SocialSource } from '@/constants/enum.js';
import { TweetUnavailableError } from '@/constants/error.js';
import { createDummyPost } from '@/helpers/createDummyPost.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getPostById } from '@/services/getPostById.js';
import { getThreads } from '@/services/getThreads.js';

export function getPostDetailQuery(source: SocialSource, postId: string) {
    return {
        queryKey: [source, 'post-detail', postId],
        queryFn: async () => {
            try {
                return await getPostById(source, postId);
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return null;
                }

                if (error instanceof TweetUnavailableError) {
                    const dummyPost = createDummyPost(Source.Twitter, TweetUnavailableError.message);
                    return dummyPost as Post;
                }

                throw error;
            }
        },
    };
}

export function getPostThreadQuery(source: SocialSource, postId: string, post?: Post | null) {
    return {
        queryKey: [source, 'post-thread', postId],
        enabled: !!post,
        queryFn: async () => {
            if (!post?.postId) return { data: EMPTY_LIST };
            return getThreads(post, source);
        },
    };
}
