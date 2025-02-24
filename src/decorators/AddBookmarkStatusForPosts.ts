import { BookmarkType, type SocialSource } from '@/constants/enum.js';
import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { Post, Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/index.js';

async function fillBookmarkDataForPosts(posts: Post[], source: SocialSource) {
    const ids = posts.map((x) => x.postId);
    if (!ids.length) return posts;

    const bookmarks = await runInSafeAsync(() =>
        FireflySocialMediaProvider.getBookmarksByIds(
            resolveFireflyPlatformFromSocialSource(source),
            ids,
            BookmarkType.Text,
        ),
    );

    return posts.map((post) => ({
        ...post,
        hasBookmarked: bookmarks?.find((x) => x.post_id === post.postId)?.has_book_marked ?? false,
    }));
}

const METHODS_BE_OVERRIDDEN = [
    'getCommentsById',
    'discoverPosts',
    'discoverPostsById',
    'getPostsByProfileId',
    'getHiddenComments',
] as const;

export function AddBookmarkStatusForPosts(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];
            Object.defineProperty(target.prototype, key, {
                value: async (...args: Parameters<Provider[K]>) => {
                    const m = method as unknown as (...args: Parameters<Provider[K]>) => ReturnType<Provider[K]>;
                    const result = await m.call(target.prototype, ...args);

                    if (result.data?.length) {
                        const posts = await fillBookmarkDataForPosts(result.data, source);
                        result.data = posts;
                    }

                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
