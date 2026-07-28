import { EMPTY_LIST } from '@dimensiondev/constants';
import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createPageable, NotFoundError, type Pageable, type PageIndicator } from '@dimensiondev/utils';

import { TweetUnavailableError } from '@/constants/error.js';
import { createDummyPost } from '@/helpers/createDummyPost.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getPostById } from '@/services/getPostById.js';
import { getThreads } from '@/services/getThreads.js';

export type PostThreadQueryData = Pageable<Post, PageIndicator | undefined>;

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
        queryFn: async (): Promise<PostThreadQueryData> => {
            if (!post?.postId) return createPageable<Post, undefined>(EMPTY_LIST, undefined);
            const result = await getThreads(post, source);
            return {
                ...result,
                data: result.data.filter((item) => !isSamePost(item, post)),
            };
        },
    };
}
