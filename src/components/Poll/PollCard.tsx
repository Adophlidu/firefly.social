import { sumBy } from 'lodash-es';
import { memo } from 'react';

import { VoteButtonPanel } from '@/components/Poll/VoteButtonPanel.js';
import { VoteResult } from '@/components/Poll/VoteResult.js';
import { Source } from '@/constants/enum.js';
import { POLL_ACTION_ENABLED } from '@/constants/poll.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useRetrievePollFromPost } from '@/hooks/useRetrievePollFromPost.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface PollCardProps {
    post: Post;
    frameUrl: string;
}

export const PollCard = memo<PollCardProps>(function PollCard({ post, frameUrl }) {
    const profile = useCurrentProfile(post.source);
    const { poll } = useRetrievePollFromPost(post);

    if (!poll) return null;

    const totalVotes = sumBy(poll.options, (option) => option.votes ?? 0);
    const maxPercent = Math.max(...poll.options.map((choice) => choice.percent || choice.votes || 0));

    const showResultsOnly =
        !POLL_ACTION_ENABLED[post.source] ||
        poll.votingStatus === 'closed' ||
        poll.options.some((option) => option.isVoted) ||
        (post.source !== Source.Lens && isSameProfile(profile, post.author));

    if (!showResultsOnly) {
        return <VoteButtonPanel source={post.source} postId={post.postId} poll={poll} />;
    }

    return (
        <div>
            {poll.options.map((option, index) => (
                <VoteResult
                    key={`${option.id}-${index}`}
                    option={option}
                    totalVotes={totalVotes}
                    maxPercent={maxPercent}
                />
            ))}
        </div>
    );
});
