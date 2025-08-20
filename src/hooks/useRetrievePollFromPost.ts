import { useQuery } from '@tanstack/react-query';

import { Source } from '@/constants/enum.js';
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
        queryFn: () => OrbProvider.getPoll(post.postId, lensProfile?.profileId),
    });

    return { poll: queryLensPoll ? lensPoll : poll, isLoading };
}
