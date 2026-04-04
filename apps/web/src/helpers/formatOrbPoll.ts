import { Source } from '@/constants/enum.js';
import { POLL_CHOICE_TYPE, POLL_STRATEGIES } from '@/constants/poll.js';
import { type OrbPoll } from '@/providers/orb/type.js';
import { type Poll } from '@/providers/types/Poll.js';

export function formatOrbPoll(orbPoll: OrbPoll): Poll {
    return {
        id: 'NO_ID',
        options: orbPoll.options.map((option, index) => ({
            id: `${option.optionKey}`,
            position: index,
            label: option.option,
            votes: option.voteCount,
            isVoted: option.myVote,
            percent: option.votePercentage || undefined,
        })),
        source: Source.Lens,
        durationSeconds: 0,
        endDatetime: new Date(orbPoll.endTimestamp).toISOString(),
        votingStatus: orbPoll.isActive ? 'open' : 'closed',
        type: orbPoll.allowMultipleAnswers ? POLL_CHOICE_TYPE.Multiple : POLL_CHOICE_TYPE.Single,
        multiple_count: `${orbPoll.options.length}`,
        strategies: POLL_STRATEGIES.None,
    };
}
