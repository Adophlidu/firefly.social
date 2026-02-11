import { safeUnreachable } from '@dimensiondev/utils';
import { compact, first, last, uniqBy } from 'lodash-es';

import { type SocialSource, Source } from '@/constants/enum.js';
import { MIN_POST_SIZE_PER_THREAD } from '@/constants/static.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { type Post } from '@/providers/types/SocialMedia.js';

function mergeThreadPostsForFarcaster(posts: Post[]) {
    const threads = compact(
        posts.map((x) =>
            x.threads?.length && x.threads.length >= MIN_POST_SIZE_PER_THREAD - 1 && x.type !== 'Mirror'
                ? x
                : undefined,
        ),
    );

    const data = posts.filter((x) => {
        if (x.type !== 'Comment') return true;
        if (
            (x.root?.postId &&
                threads.some((thread) => isSamePost(thread, x.root) && isSameProfile(thread.author, x.author))) ||
            (x.commentOn?.postId &&
                threads.some((thread) => isSamePost(thread, x.commentOn) && isSameProfile(thread.author, x.author)))
        )
            return false;

        return true;
    });

    return data.map((x) => {
        // The data in the threads field of firefly will omit the root post.
        if (x.threads?.length && x.threads.length >= MIN_POST_SIZE_PER_THREAD - 1 && x.type !== 'Mirror') {
            const current = x.threads.length === 2 ? last(x.threads) : first(x.threads);
            const parent = x.threads.length === 2 ? first(x.threads) : undefined;
            if (!current) return x;
            return {
                ...current,
                isThread: true,
                commentOn: parent,
                root: x,
            };
        }

        return x;
    });
}

function mergeThreadPostsForLens(posts: Post[]) {
    const filtered = posts.filter((post, index, arr) => {
        if (post.type !== 'Comment') return true;

        if (
            !post.root &&
            isSameProfile(post.author, post.commentOn?.author) &&
            arr.some((x) => isSamePost(x.root, post.commentOn))
        )
            return false;

        return true;
    });

    return uniqBy(filtered, (x) => {
        if (x.type === 'Mirror') return `Mirror:${x.publicationId}`;
        if (x.type !== 'Comment' || !x.root) return x.publicationId;
        if (x.type === 'Comment' && x.firstComment?.postId !== x.postId) return x.publicationId;

        return x.root.publicationId;
    }).map((post) => {
        if (
            post.type === 'Comment' &&
            isSamePost(post.firstComment, post) &&
            isSameProfile(post.commentOn?.author, post.author) &&
            isSameProfile(post.root?.author, post.author)
        ) {
            return {
                ...post,
                isThread: true,
            };
        }

        return post;
    });
}

function mergeThreadPostsForTweet(posts: Post[]) {
    const rootPostMap = new Map(posts.map((post) => [post.postId, post]));
    return uniqBy(posts, (x) => {
        if (x.type === 'Mirror') return `Mirror:${x.postId}`;
        if (x.type === 'Comment' && x.rootPostId) return x.rootPostId;
        return x.postId;
    }).map((post) => {
        if (post.type === 'Comment') {
            return {
                ...post,
                root:
                    post.rootPostId &&
                    post.parentPostId !== post.rootPostId &&
                    post.commentOn?.postId !== post.rootPostId
                        ? rootPostMap.get(post.rootPostId)
                        : undefined,
                commentOn: post.parentPostId
                    ? (rootPostMap.get(post.parentPostId) ?? post.commentOn) // There is full information in the post of the root timeline
                    : post.commentOn,
                isThread: true,
            };
        }
        return post;
    });
}

function mergeThreadPostsForBsky(posts: Post[]) {
    const rootPostMap = new Map(posts.map((post) => [post.publicationId, post]));
    return uniqBy(posts, (x) => {
        if (x.type === 'Mirror') return `Mirror:${x.publicationId}`;
        if (x.type === 'Comment' && x.rootPostId) return x.rootPostId;
        return x.publicationId;
    }).map((post) => {
        if (post.type === 'Comment' && isSameProfile(post.commentOn?.author, post.author)) {
            const root =
                post.rootPostId &&
                post.parentPostId !== post.rootPostId &&
                post.commentOn?.publicationId !== post.rootPostId
                    ? rootPostMap.get(post.rootPostId)
                    : undefined;
            const commentOn = post.commentOn?.publicationId
                ? (rootPostMap.get(post.commentOn?.publicationId) ?? post.commentOn)
                : post.commentOn;

            return {
                ...post,
                root,
                commentOn,
                isThread: !!(root && commentOn),
            };
        }
        return post;
    });
}

/**
 * Merge related posts into threads if needed
 * @param source
 * @param posts
 * @returns
 */
export function mergeThreadPosts(source: SocialSource, posts: Post[]): Post[] {
    switch (source) {
        case Source.Lens:
            return mergeThreadPostsForLens(posts);
        case Source.Farcaster:
            return mergeThreadPostsForFarcaster(posts);
        case Source.Twitter:
            return mergeThreadPostsForTweet(posts);
        case Source.Bsky:
            return mergeThreadPostsForBsky(posts);
        default:
            safeUnreachable(source);
            return posts;
    }
}

export function mergeThreadPostsWithoutSource(posts: Post[]): Post[] {
    const record = new Set();
    const threads = compact(
        posts.map((x) =>
            x.threads?.length && x.threads.length >= MIN_POST_SIZE_PER_THREAD - 1 && x.type !== 'Mirror'
                ? x
                : undefined,
        ),
    );
    const filtered = posts.filter((post, index, arr) => {
        switch (post.source) {
            case Source.Farcaster: {
                if (post.type !== 'Comment') return true;
                if (
                    (post.root?.postId &&
                        threads.some(
                            (thread) => isSamePost(thread, post.root) && isSameProfile(thread.author, post.author),
                        )) ||
                    (post.commentOn?.postId &&
                        threads.some(
                            (thread) => isSamePost(thread, post.commentOn) && isSameProfile(thread.author, post.author),
                        ))
                )
                    return false;

                return true;
            }

            case Source.Lens: {
                if (post.type !== 'Comment') return true;

                if (
                    !post.root &&
                    isSameProfile(post.author, post.commentOn?.author) &&
                    arr.some((x) => isSamePost(x.root, post.commentOn))
                )
                    return false;

                return true;
            }

            case Source.Twitter: {
                if (post.type !== 'Comment') return true;
                if (record.has(post.postId) || record.has(post.commentOn?.postId) || record.has(post.postId))
                    return false;

                if (
                    post.root &&
                    isSameProfile(post.commentOn?.author, post.author) &&
                    isSameProfile(post.author, post.root.author) &&
                    !record.has(post.root.postId)
                ) {
                    record.add(post.root.postId);
                    return true;
                }

                return true;
            }
            case Source.Bsky:
                if (post.type !== 'Comment') return true;
                if (record.has(post.postId) || record.has(post.commentOn?.postId)) return false;
                if (
                    post.root &&
                    isSameProfile(post.commentOn?.author, post.author) &&
                    isSameProfile(post.author, post.root.author) &&
                    !record.has(post.root.postId)
                ) {
                    record.add(post.root.postId);
                    return true;
                }
                return true;
            default:
                safeUnreachable(post.source);
                return true;
        }
    });

    return uniqBy(filtered, (x) => {
        if (x.type === 'Mirror') return `Mirror:${x.publicationId}`;
        if (x.type !== 'Comment' || !x.root) return x.publicationId;

        return x.root.publicationId;
    }).map((post) => {
        switch (post.source) {
            case Source.Farcaster: {
                if (
                    post.threads?.length &&
                    post.threads.length >= MIN_POST_SIZE_PER_THREAD - 1 &&
                    post.type !== 'Mirror'
                ) {
                    const current = post.threads.length === 2 ? last(post.threads) : first(post.threads);
                    const parent = post.threads.length === 2 ? first(post.threads) : undefined;
                    if (!current) return post;
                    return {
                        ...current,
                        isThread: true,
                        commentOn: parent,
                        root: post,
                    };
                }

                return post;
            }
            case Source.Lens: {
                if (
                    post.type === 'Comment' &&
                    isSamePost(post.firstComment, post) &&
                    isSameProfile(post.commentOn?.author, post.author) &&
                    isSameProfile(post.root?.author, post.author)
                ) {
                    return {
                        ...post,
                        isThread: true,
                    };
                }

                return post;
            }
            case Source.Twitter: {
                if (record.has(post.root?.postId))
                    return {
                        ...post,
                        isThread: true,
                    };

                return post;
            }
            case Source.Bsky:
                return post;
            default:
                safeUnreachable(post.source);
                return post;
        }
    });
}
