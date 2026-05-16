import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import type { Context } from 'hono';

import { SNAPSHOT_GRAPHQL_URL } from '@/snapshot/src/constants.js';
import { VotesQuery } from '@/snapshot/src/queries.js';
import type { SnapshotVotes } from '@/snapshot/src/types.js';

export interface VoteResultsByVoterResult {
    votes: SnapshotVotes['data']['votes'];
    nextSkip?: number;
}

export async function pathQueryVoteResultsByVoter(
    ids: string[],
    voter: string,
    c: Context,
    skip = 0,
    first = 20,
): Promise<VoteResultsByVoterResult> {
    const votesResponse = await fetchJson<SnapshotVotes>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...VotesQuery,
            variables: {
                ids,
                voter,
                first,
                skip,
            },
        }),
        context: c,
    });

    const votes = votesResponse.data.votes;

    return {
        votes,
        nextSkip: votes.length === first ? skip + first : undefined,
    };
}
