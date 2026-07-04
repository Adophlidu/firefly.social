import type { Post } from '@/providers/types/SocialMedia.js';

function compactAuthor(author: Post['author'], sharedAuthors?: Map<string, Post['author']>): Post['author'] {
    const key = `${author.profileSource}:${author.profileId}`;
    const cached = sharedAuthors?.get(key);
    if (cached) return cached;

    const compacted: Post['author'] = {
        ...author,
        bio: undefined,
    };
    sharedAuthors?.set(key, compacted);
    return compacted;
}

/**
 * Compact a related post (root/commentOn) down to one level: PostRoot/PostParent render these
 * on comment posts, and getThreads resolves the thread root from them on the client, so they
 * must survive the transfer — but their own nested parents are never rendered and can be dropped.
 */
function compactRelatedPost(
    post: Post,
    sharedPosts?: Map<string, Post>,
    sharedAuthors?: Map<string, Post['author']>,
): Post {
    const key = `${post.source}:${post.postId}`;
    const cached = sharedPosts?.get(key);
    if (cached) return cached;

    const compacted: Post = {
        ...post,
        author: compactAuthor(post.author, sharedAuthors),
        root: undefined,
        commentOn: undefined,
    };
    sharedPosts?.set(key, compacted);
    return compacted;
}

/** Drop nested/heavy fields before passing post data through the RSC client boundary. */
export function compactPostForPageTransfer(post: Post, shared?: Map<string, Post>): Post {
    const sharedAuthors = new Map<string, Post['author']>();
    return {
        ...post,
        author: compactAuthor(post.author, sharedAuthors),
        root: post.root ? compactRelatedPost(post.root, shared, sharedAuthors) : undefined,
        commentOn: post.commentOn ? compactRelatedPost(post.commentOn, shared, sharedAuthors) : undefined,
    };
}

export function compactPostsForPageTransfer(posts: Post[]) {
    // Posts in one thread share the same root; reusing one compacted instance lets the RSC
    // serializer dedupe it by reference instead of embedding a copy per post. Authors are
    // interned the same way so repeated bylines do not bloat the SSR payload.
    const sharedPosts = new Map<string, Post>();
    const sharedAuthors = new Map<string, Post['author']>();
    return posts.map((post) => {
        return {
            ...post,
            author: compactAuthor(post.author, sharedAuthors),
            root: post.root ? compactRelatedPost(post.root, sharedPosts, sharedAuthors) : undefined,
            commentOn: post.commentOn ? compactRelatedPost(post.commentOn, sharedPosts, sharedAuthors) : undefined,
        };
    });
}
