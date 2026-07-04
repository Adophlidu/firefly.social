import type { Post } from '@/providers/types/SocialMedia.js';

function compactAuthor(author: Post['author']): Post['author'] {
    return {
        ...author,
        bio: undefined,
    };
}

/**
 * Compact a related post (root/commentOn) down to one level: PostRoot/PostParent render these
 * on comment posts, and getThreads resolves the thread root from them on the client, so they
 * must survive the transfer — but their own nested parents are never rendered and can be dropped.
 */
function compactRelatedPost(post: Post, shared?: Map<string, Post>): Post {
    const key = `${post.source}:${post.postId}`;
    const cached = shared?.get(key);
    if (cached) return cached;

    const compacted: Post = {
        ...post,
        author: compactAuthor(post.author),
        root: undefined,
        commentOn: undefined,
    };
    shared?.set(key, compacted);
    return compacted;
}

/** Drop nested/heavy fields before passing post data through the RSC client boundary. */
export function compactPostForPageTransfer(post: Post, shared?: Map<string, Post>): Post {
    return {
        ...post,
        author: compactAuthor(post.author),
        root: post.root ? compactRelatedPost(post.root, shared) : undefined,
        commentOn: post.commentOn ? compactRelatedPost(post.commentOn, shared) : undefined,
    };
}

export function compactPostsForPageTransfer(posts: Post[]) {
    // Posts in one thread share the same root; reusing one compacted instance lets the RSC
    // serializer dedupe it by reference instead of embedding a copy per post.
    const shared = new Map<string, Post>();
    return posts.map((post) => compactPostForPageTransfer(post, shared));
}
