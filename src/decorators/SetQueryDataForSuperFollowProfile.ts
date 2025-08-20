import { Source } from '@/constants/enum.js';
import { setFollowStatus } from '@/decorators/SetQueryDataForFollowProfile.js';
import type { LensSocialMedia } from '@/providers/lens/SocialMedia.js';
import type { ClassType } from '@/types/utility.js';

const OVERRIDDEN_METHODS = ['superFollow'] as const;

export function SetQueryDataForSuperFollowProfile(source: Source) {
    return function decorator<T extends ClassType<LensSocialMedia>>(target: T): T {
        function overrideMethod<K extends (typeof OVERRIDDEN_METHODS)[number]>(key: K) {
            const method = target.prototype[key] as LensSocialMedia[K];

            Object.defineProperty(target.prototype, key, {
                value: async (profileId: string) => {
                    const m = method as (profileId: string) => Promise<boolean>;
                    const status = await m?.call(target.prototype, profileId);
                    setFollowStatus(source, profileId, status);
                    return status;
                },
            });
        }

        OVERRIDDEN_METHODS.forEach(overrideMethod);
        return target;
    };
}
