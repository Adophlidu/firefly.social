import { NotImplementedError } from '@dimensiondev/utils';

import {
    type CompositePoll,
    type Poll,
    type PollOption,
    type Provider,
    type VoteResponseData,
} from '@/providers/types/Poll.js';

class BskyPoll implements Provider {
    async createPoll(poll: CompositePoll): Promise<Poll> {
        throw new NotImplementedError();
    }

    vote(options: {
        postId: string;
        pollId: string;
        frameUrl: string;
        options: PollOption[];
    }): Promise<VoteResponseData> {
        throw new NotImplementedError();
    }

    getPollById(pollId: string): Promise<Poll> {
        throw new NotImplementedError();
    }
}

export const BskyPollProvider = new BskyPoll();
