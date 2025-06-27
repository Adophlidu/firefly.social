import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { NotImplementedError } from '@/constants/error.js';
import { NitterSocialMediaProvider } from '@/providers/twitter/NitterSocialMedia.js';
import type { OfficialSocialMedia } from '@/providers/twitter/OfficialSocialMedia.js';
import type { Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/index.js';

const METHODS_BE_OVERRIDDEN = [
    'getRepliesPostsByProfileId',
    'getCommentsById',
    'getThreadByPostId',
    'getPostsByProfileId',
    'getPostById',
    'getProfileById',
    'getProfileByHandle',
    'getProfileByIdOrHandle',
    'getPinnedPost',
    'searchPosts',
    'searchProfiles',
    'getMediaPostsByProfileId',
    'getProfilesByIds',
] as const;

export function WithNitter() {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as OfficialSocialMedia[K];
            Object.defineProperty(target.prototype, key, {
                value: async (...args: Parameters<OfficialSocialMedia[K]>) => {
                    type Method = (...args: Parameters<Provider[K]>) => ReturnType<Provider[K]>;
                    const originMethod = method as unknown as Method;
                    try {
                        const m = NitterSocialMediaProvider[key] as unknown as Method;
                        return await m.call(NitterSocialMediaProvider, ...args);
                    } catch (error) {
                        if (error instanceof NotImplementedError) {
                            return originMethod.call(target.prototype, ...args);
                        }
                        throw error;
                    }
                },
            });
        }
        if (env.external.NEXT_PUBLIC_NITTER === STATUS.Enabled) {
            METHODS_BE_OVERRIDDEN.forEach(overrideMethod);
        }
        return target;
    };
}
