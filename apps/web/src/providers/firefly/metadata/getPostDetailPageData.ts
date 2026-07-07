import type { SocialSource } from '@dimensiondev/enums';
import { runInSafeAsync, UnauthorizedError } from '@dimensiondev/utils';
import { cache } from 'react';

import type { PostThreadQueryData } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/query.js';
import { compactPostForPageTransfer, compactPostsForPageTransfer } from '@/helpers/compactPostForPageTransfer.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getPostById } from '@/services/getPostById.js';
import { getThreads } from '@/services/getThreads.js';

export const getPostDetailPageData = cache(async (source: SocialSource, postId: string) => {
    let post: Post | null | undefined;
    let unauthorized = false;

    try {
        post = await getPostById(source, postId);
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            unauthorized = true;
        } else {
            post = undefined;
        }
    }

    if (!post) {
        return { post, unauthorized, initialThread: undefined };
    }

    // A thread fetch failure must not take down the whole page (the old prefetchQuery
    // swallowed it); the client refetches the thread on its own when this is undefined.
    const thread = await runInSafeAsync(() => getThreads(post!, source));
    const initialThread: PostThreadQueryData | undefined = thread
        ? {
              ...thread,
              data: compactPostsForPageTransfer(thread.data.filter((item) => !isSamePost(item, post))),
          }
        : undefined;

    return {
        post: compactPostForPageTransfer(post),
        unauthorized,
        initialThread,
    };
});
