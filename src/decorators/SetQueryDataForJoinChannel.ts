import { safeUnreachable } from '@dimensiondev/utils';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { type Channel, type Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/utility.js';

const METHODS_BE_OVERRIDDEN = ['joinChannel', 'leaveChannel'] as const;

function setJoinStatus(source: SocialSource, channel: Channel, status: boolean) {
    queryClient.setQueriesData<Channel>(
        {
            queryKey: ['channel', channel.source, channel.id],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                if (draft.id === channel.id && draft.source === channel.source) {
                    draft.isMember = status;
                    draft.followerCount = (draft.followerCount || 0) + (status ? 1 : -1);
                }
                return draft;
            });
        },
    );

    switch (source) {
        case Source.Farcaster:
            queryClient.refetchQueries({ queryKey: ['profiles', source, 'followers-of', channel.id] });
            break;
        case Source.Lens:
            queryClient.refetchQueries({ queryKey: ['profiles', source, 'members-of', channel.id] });
            break;
        case Source.Bsky:
        case Source.Twitter:
            break;
        default:
            safeUnreachable(source);
            break;
    }
}

export function SetQueryDataForJoinChannel(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];

            Object.defineProperty(target.prototype, key, {
                value: async (channel: Channel) => {
                    const m = method as (channel: Channel) => Promise<boolean>;
                    const result = await m?.call(target.prototype, channel);
                    if (!result) return false;

                    setJoinStatus(source, channel, key === 'joinChannel');
                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);
        return target;
    };
}
