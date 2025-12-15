import type { SocialSource, SourceInURL } from '@/constants/enum.js';
import type { POLL_CHOICE_TYPE, POLL_STRATEGIES } from '@/constants/poll.js';
import type { Pageable } from '@/helpers/pageable.js';
import type { Response as FireflyResponse } from '@/providers/types/Firefly.js';

export interface PollOption {
    id: string;
    position?: number;
    label: string;
    votes?: number;
    isVoted?: boolean;
    percent?: number;
}

export interface Poll {
    id: string;
    options: PollOption[];
    source: SocialSource;
    durationSeconds: number;
    endDatetime?: string;
    votingStatus?: string;
    type: POLL_CHOICE_TYPE;
    multiple_count?: string;
    strategies: POLL_STRATEGIES;
}

export interface CompositePoll {
    // tracking poll id for each social source
    pollIds: Record<SocialSource, string | null>;
    options: PollOption[];
    duration: {
        days: number;
        hours: number;
        minutes: number;
    };
    type: POLL_CHOICE_TYPE;
    multiple_count?: string;
    strategies: POLL_STRATEGIES;
}

export interface CreatePollRequest {
    title: string;
    choices: string[];
    type: POLL_CHOICE_TYPE;
    multiple_count?: string;
    sub_time: number;
    strategies: POLL_STRATEGIES;
}

export type CreatePollResponse = FireflyResponse<{
    poll_id: string;
}>;

interface FireflyPollOption {
    id: number;
    name: string;
    count: number;
    is_select: boolean;
    percent: number | null;
}

export interface FireflyPoll {
    poll_id: string;
    created_time: number;
    end_time: number;
    is_end: boolean;
    vote_count: number;
    type: POLL_CHOICE_TYPE;
    multiple_count: number;
    choice_detail: FireflyPollOption[];
}

export type GetPollResponse = FireflyResponse<FireflyPoll>;

export interface VoteResponseData {
    is_success: boolean;
    choice_detail: FireflyPollOption[];
}

export type VoteResponse = FireflyResponse<VoteResponseData>;

export interface VoteRequestOptions {
    poll_id: string;
    platform: SourceInURL.Farcaster | SourceInURL.Lens;
    platform_id: string;
    choices: number[];
    farcaster_miniapp_token?: string;
}

export interface Provider {
    /**
     * Creates a new poll
     * @param poll
     * @param text Optional text to associate with the poll
     * @returns
     */
    createPoll: (poll: CompositePoll, text?: string) => Promise<Poll>;

    /**
     * Retrieves a poll by its id
     * @param pollId
     * @returns
     */
    getPollById: (pollId: string) => Promise<Poll>;

    /**
     * Votes for an option in a poll
     * @param postId
     * @param pollId
     * @param frameUrl
     * @param option
     * @returns
     */
    vote: (options: {
        postId: string;
        pollId: string;
        frameUrl: string;
        options: PollOption[];
        allOptions?: PollOption[];
    }) => Promise<VoteResponseData>;

    /**
     * Deletes a poll by its id
     */
    deletePoll?: (pollId: string) => Promise<void>;

    /**
     * Retrieves all polls
     * @returns
     */
    getPollsByProfileId?: (profileId: string) => Promise<Pageable<Poll>>;
}
