import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Post, Provider } from '@/providers/types/SocialMedia.js';
import { useTwitterRetweetStore } from '@/store/useTwitterRetweetStore.js';
import type { ClassType } from '@/types/utility.js';

const METHODS_BE_OVERRIDDEN = [
    'getLikedPostsByProfileId',
    'getRepliesPostsByProfileId',
    'getPostsByProfileId',
    'getMediaPostsByProfileId',
] as const;

export function UndoRepostStatusToTwitterPosts() {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];
            Object.defineProperty(target.prototype, key, {
                value: async (...args: Parameters<Provider[K]>) => {
                    const m = method as unknown as (...args: Parameters<Provider[K]>) => ReturnType<Provider[K]>;
                    const result = await m.call(target.prototype, ...args);

                    const session = twitterSessionHolder.session;
                    if (!session?.profileId) return result;

                    // filter retweet status to `Promise<Pageable<Post, PageIndicator>>`
                    if (
                        result &&
                        typeof result === 'object' &&
                        'data' in result &&
                        Array.isArray(result.data) &&
                        result.data.length > 0
                    ) {
                        return {
                            ...result,
                            data: result.data.filter(
                                (post: Post) =>
                                    !useTwitterRetweetStore.getState().isUndoRepost(session.profileId, post.postId),
                            ),
                        };
                    }

                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
