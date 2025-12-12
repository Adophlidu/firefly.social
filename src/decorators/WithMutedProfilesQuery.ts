import { isServer } from '@tanstack/react-query';

import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Provider } from '@/providers/types/SocialMedia.js';
import { queryMutedProfiles } from '@/services/queryMutedProfiles.js';
import type { ClassType } from '@/types/utility.js';

const METHODS_BE_OVERRIDDEN = [
    'getChannelMembers',
    'getChannelFollowers',
    'getFollowers',
    'getFollowings',
    'getMutualFollowers',
    'getLikeReactors',
    'getRepostReactors',
    'searchProfiles',
    'getBlockedProfiles',
] as const;

export function WithMutedProfilesQuery() {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        if (isServer) return target;

        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];
            if (!method) return;
            Object.defineProperty(target.prototype, key, {
                value: async (...args: Parameters<Provider[K]>) => {
                    const m = method as unknown as (...args: Parameters<Provider[K]>) => ReturnType<Provider[K]>;
                    const pageable = await m.apply(target, args);
                    const identifiers: FireflyIdentity[] = pageable.data.map((x) => ({
                        source: x.source,
                        id: x.profileId,
                    }));

                    if (identifiers.length) {
                        runInSafeAsync(() => queryMutedProfiles(identifiers));
                    }
                    return pageable;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
