import { useQuery } from '@tanstack/react-query';
import { sumBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { getPoll } from '@/providers/orb/getPoll.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { useOrbPollResultStore } from '@/store/useOrbPollResultStore.js';

export function useRetrievePollFromPost(post: Post) {
    const lensProfile = useCurrentProfile(Source.Lens);
    const { pollResult } = useOrbPollResultStore();

    const poll = post.poll || null;
    const queryLensPoll = post.source === Source.Lens && !!post.hasPoll;

    const { data: lensPoll = null, isLoading } = useQuery({
        queryKey: ['post', 'poll', Source.Lens, post.postId, lensProfile?.profileId],
        enabled: queryLensPoll,
        staleTime: 1000 * 60 * 2, // 2 minutes
        queryFn: async () => {
            const poll = await getPoll(post.postId, lensProfile?.profileId);
            if (poll) {
                patchPostQueryData(Source.Lens, post.postId, (draft) => {
                    draft.poll = poll;
                });
            }

            return poll;
        },
        select: (data) => {
            try {
                if (!data || !lensProfile) return data;
                if (data.options.some((option) => option.isVoted)) return data;

                const cachedOptions = pollResult[lensProfile.profileId]?.[post.postId];
                if (!cachedOptions?.length) return data;

                const voteCount = sumBy(data.options, (option) => option.votes || 0) + cachedOptions.length;
                return {
                    ...data,
                    options: data.options.map((option) => {
                        const isVoted = cachedOptions.includes(option.id);
                        const curVotes = isVoted ? (option.votes || 0) + 1 : option.votes || 0;
                        return {
                            ...option,
                            votes: curVotes,
                            isVoted,
                            percent: (curVotes / voteCount) * 100,
                        };
                    }),
                };
            } catch {
                return data;
            }
        },
    });

    return { poll: queryLensPoll ? lensPoll : poll, isLoading };
}
