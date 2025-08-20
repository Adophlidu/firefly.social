import { useQuery } from '@tanstack/react-query';

import { Source } from '@/constants/enum.js';
import { patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { OrbProvider } from '@/providers/orb/index.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useRetrievePollFromPost(post: Post) {
    const lensProfile = useCurrentProfile(Source.Lens);

    const poll = post.poll || null;
    const queryLensPoll = post.source === Source.Lens && !!post.hasPoll;

    const { data: lensPoll = null, isLoading } = useQuery({
        queryKey: ['post', 'poll', Source.Lens, post.postId, lensProfile?.profileId],
        enabled: queryLensPoll,
        staleTime: 1000 * 60 * 2, // 2 minutes
        queryFn: async () => {
            const poll = await OrbProvider.getPoll(post.postId, lensProfile?.profileId);
            if (poll) {
                patchPostQueryData(Source.Lens, post.postId, (draft) => {
                    draft.poll = poll;
                });
            }

            return poll;
        },
    });

    return { poll: queryLensPoll ? lensPoll : poll, isLoading };
}
