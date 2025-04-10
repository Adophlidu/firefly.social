import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import type { SocialSource } from '@/constants/enum.js';
import { type LensSocialMedia } from '@/providers/lens/SocialMedia.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/index.js';

const METHODS_BE_OVERRIDDEN = ['joinGroup', 'leaveGroup'] as const;

function setJoinStatus(source: SocialSource, groupId: string, status: boolean) {
    queryClient.setQueriesData<ProfileGroup>(
        {
            queryKey: ['group', source, groupId],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                if (draft.id === groupId && draft.source === source) {
                    draft.isMember = status;
                }

                return draft;
            });
        },
    );
    queryClient.setQueriesData<number>(
        {
            queryKey: ['group', 'members-count', groupId],
        },
        (old) => {
            if (typeof old !== 'number') return old;

            return old + (status ? 1 : -1);
        },
    );

    queryClient.refetchQueries({
        queryKey: [['profiles', source, 'group', groupId]],
    });
}

export function SetQueryDataForJoinGroup(source: SocialSource) {
    return function decorator<T extends ClassType<LensSocialMedia>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as LensSocialMedia[K];

            Object.defineProperty(target.prototype, key, {
                value: async (groupId: string) => {
                    const m = method as (groupId: string) => Promise<boolean>;
                    const result = await m?.call(target.prototype, groupId);
                    if (!result) return false;

                    setJoinStatus(source, groupId, key === 'joinGroup');
                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);
        return target;
    };
}
