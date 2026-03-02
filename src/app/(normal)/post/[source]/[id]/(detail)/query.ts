import { NotFoundError } from '@dimensiondev/utils';

import { type SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { type Post } from '@/providers/types/SocialMedia.js';
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
            if (!post) return { data: EMPTY_LIST };
            return getThreads(post, source);
        },
    };
}
