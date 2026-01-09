import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { type Poll, type PollOption, type Provider, type VoteResponseData } from '@/providers/types/Poll.js';
import { type ClassType } from '@/types/utility.js';

const METHODS_BE_OVERRIDDEN = ['vote'] as const;

function updatePollFromQueryData(data: VoteResponseData, source: SocialSource, pollId: string) {
    if (!data?.is_success) return;
    const profile = getSessionFromStorageBySource(source);
    const updater = (old?: Poll) => {
        if (!old) return old;
        return produce(old, (draft) => {
            draft.options = draft.options.map((option) => {
                const choice = data.choice_detail.find((x) => option.id === `${x.id}`);
                if (!choice) return option;

                return {
                    id: `${choice.id}`,
                    position: choice.id,
                    label: choice.name,
                    votes: choice.count,
                    isVoted: choice.is_select,
                    percent: choice.percent || undefined,
                };
            });
        });
    };

    queryClient.setQueriesData<Poll>(
        {
            queryKey: ['poll', source, pollId, profile?.profileId],
        },
        updater,
    );
    if (source === Source.Lens) {
        queryClient.setQueriesData<Poll>(
            {
                queryKey: ['post', 'poll', source, pollId, profile?.profileId],
            },
            updater,
        );
    }
}

export function SetQueryDataForVote(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];

            Object.defineProperty(target.prototype, key, {
                value: async (options: { postId: string; pollId: string; frameUrl: string; options: PollOption[] }) => {
                    const m = method as (options: {
                        postId: string;
                        pollId: string;
                        frameUrl: string;
                        options: PollOption[];
                    }) => ReturnType<Provider[K]>;
                    const result = await m.call(target.prototype, options);
                    updatePollFromQueryData(result, source, source === Source.Lens ? options.postId : options.pollId);
                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
