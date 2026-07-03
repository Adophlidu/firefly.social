import type { SocialSource } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { compact, uniq } from 'lodash-es';

import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { getFireflyBookmarksByIds } from '@/providers/firefly/endpoint/getFireflyBookmarkIds.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetBookmarksResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function fillBookmarkStatus(post: Post, bookmarkData: Required<GetBookmarksResponse>['data']['list']): Post {
    return {
        ...post,
        hasBookmarked: bookmarkData.some((bookmark) => bookmark.post_id === post.postId && !!bookmark.has_book_marked),
    };
}

export async function fillBookmarkStatusForPosts(posts: Post[], source: SocialSource) {
    // Bookmark status is user-scoped. Without a Firefly session (e.g. Vercel
    // build / SSR with no signed-in user) the query endpoint always 401s and
    // every post would come back un-bookmarked anyway, so skip the request.
    if (!fireflySessionHolder.session) return posts;

    const postIds = uniq(
        posts.flatMap((p) =>
            compact([p.postId, p.root?.postId, p.commentOn?.postId].concat(p.comments?.map((p) => p.postId) || [])),
        ),
    );
    if (!postIds.length) return posts;

    const bookmarkData =
        (await runInSafeAsync(() =>
            getFireflyBookmarksByIds(resolveFireflyPlatformFromSocialSource(source), postIds),
        )) || [];

    return posts.map((post) => {
        const newPost = fillBookmarkStatus(post, bookmarkData);
        if (newPost.root) {
            newPost.root = fillBookmarkStatus(newPost.root, bookmarkData);
        }
        if (newPost.commentOn) {
            newPost.commentOn = fillBookmarkStatus(newPost.commentOn, bookmarkData);
        }
        if (newPost.comments?.length) {
            newPost.comments = newPost.comments.map((p) => fillBookmarkStatus(p, bookmarkData));
        }

        return newPost;
    });
}
