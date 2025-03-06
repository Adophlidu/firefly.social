import { skipToken, useQueries, useQuery } from '@tanstack/react-query';

import type { Post } from '@/providers/types/SocialMedia.js';
import { classifyPostLink } from '@/services/getPostLinks.js';

export function useClassifyPostLink(url: string | null | undefined, post: Post) {
    return useQuery({
        queryKey: ['classify-post-link', url, post.postId],
        queryFn: url ? () => classifyPostLink(url, post) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useClassifyPostLinks(urls: string[], post: Post) {
    return useQueries({
        queries: urls.map((url) => ({
            queryKey: ['classify-post-link', url, post.postId],
            queryFn: () => (url ? classifyPostLink(url, post) : null),
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            retry: false,
        })),
        combine(result) {
            return result.map((query) => query.data);
        },
    });
}
