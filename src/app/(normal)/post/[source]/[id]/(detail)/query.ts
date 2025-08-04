import type { SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getPostById } from '@/services/getPostById.js';
import { getThreads } from '@/services/getThreads.js';

export function getPostDetailQuery(source: SocialSource, postId: string) {
    return {
        queryKey: [source, 'post-detail', postId],
        queryFn: async () => getPostById(source, postId),
    };
}

export function getPostThreadQuery(source: SocialSource, postId: string, post?: Post) {
    return {
        queryKey: [source, 'post-thread', postId],
        enabled: !!post,
        queryFn: async () => {
            if (!post) return { data: EMPTY_LIST };
            return getThreads(post, source);
        },
    };
}
