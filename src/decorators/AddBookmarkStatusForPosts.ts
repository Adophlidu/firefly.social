import { type SocialSource } from '@/constants/enum.js';
import { type Provider } from '@/providers/types/SocialMedia.js';
import { fillBookmarkStatusForPosts } from '@/services/fillBookmarkStatusForPosts.js';
import { type ClassType } from '@/types/utility.js';

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
                        const posts = await fillBookmarkStatusForPosts(result.data, source);
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
