import { NotImplementedError } from '@dimensiondev/utils';
import { first } from 'lodash-es';

import { Source, SourceInURL } from '@/constants/enum.js';
import { SetQueryDataForVote } from '@/decorators/SetQueryDataForVote.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { getPollDurationSeconds } from '@/helpers/polls.js';
import { commitPoll } from '@/providers/firefly/poll/commitPoll.js';
import { voteV2 } from '@/providers/firefly/poll/voteV2.js';
import type { CompositePoll, Poll, PollOption, Provider, VoteResponseData } from '@/providers/types/Poll.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

@SetQueryDataForVote(Source.Farcaster)
class FarcasterPoll implements Provider {
    async createPoll(poll: CompositePoll, text = ''): Promise<Poll> {
        return {
            id: poll.pollIds?.Farcaster || (await commitPoll(poll, text)),
            options: poll.options,
            durationSeconds: getPollDurationSeconds(poll.duration),
            source: Source.Farcaster,
            type: poll.type,
            strategies: poll.strategies,
            multiple_count: poll.multiple_count,
        };
    }

    async vote({
        postId,
        pollId,
        frameUrl,
        options,
    }: {
        postId: string;
        pollId: string;
        frameUrl: string;
        options: PollOption[];
    }): Promise<VoteResponseData> {
        const session = getSessionFromStorage(SessionType.Farcaster);
        if (!session) throw new Error('Profile not found');

        const option = first(options);
        if (!option) {
            throw new Error('No selected choice.');
        }

        return voteV2({
            poll_id: pollId,
            platform: SourceInURL.Farcaster,
            platform_id: session.profileId,
            choices: [+option.id],
        });
    }

    getPollById(pollId: string): Promise<Poll> {
        throw new NotImplementedError();
    }
}

export const FarcasterPollProvider = new FarcasterPoll();
