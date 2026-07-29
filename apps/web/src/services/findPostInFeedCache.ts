import { queryClient } from '@/configs/queryClient.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface InfinitePageLike {
    data?: Post[];
    pages?: InfinitePageLike[];
}

function* iterateCachedPosts(value: unknown): Generator<Post> {
    if (!value || typeof value !== 'object') return;
    const page = value as InfinitePageLike;
    if (Array.isArray(page.data)) {
        for (const post of page.data) {
            if (post && typeof post === 'object' && 'postId' in post) yield post;
        }
    }
    if (Array.isArray(page.pages)) {
        for (const nested of page.pages) yield* iterateCachedPosts(nested);
    }
}

/**
 * Find a post the timeline already rendered, by walking every cached
 * `['posts', …]` infinite query in the shared browser QueryClient. Client
 * navigations use it to show the clicked post instantly (stale-while-
 * revalidate) instead of blocking the detail loader on a refetch. Always
 * returns undefined on the server. (Mirror wrappers are matched on their
 * own postId; original-post lookups fall through to the API path.)
 */
export function findPostInFeedCache(postId: string): Post | undefined {
    if (typeof window === 'undefined') return undefined;
    for (const query of queryClient.getQueryCache().findAll({ queryKey: ['posts'] })) {
        for (const post of iterateCachedPosts(query.state.data)) {
            // Lens URLs use the v3 slug / v2 id while the cached post keys on
            // its own postId (and rootPostId for mirror wrappers).
            if (
                post.postId === postId ||
                post.rootPostId === postId ||
                post.publicationId === postId ||
                post.slug === postId
            ) {
                return post;
            }
        }
    }
    return undefined;
}
