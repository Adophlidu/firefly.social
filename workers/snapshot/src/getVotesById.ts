import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { isSameAddress } from '@dimensiondev/workers-shared/helpers/isSameAddress.js';
import type { Context } from 'hono';

import { SNAPSHOT_GRAPHQL_URL } from '@/snapshot/src/constants.js';
import { UsersQuery, VotesQuery } from '@/snapshot/src/queries.js';
import type { SnapshotUsers, SnapshotVote, SnapshotVotes } from '@/snapshot/src/types.js';

export interface GetVotesByIdResult {
    votes: SnapshotVote[];
    nextSkip?: number;
}

export async function getVotesById(id: string, c: Context, skip = 0, first = 20): Promise<GetVotesByIdResult> {
    const votesResponse = await fetchJson<SnapshotVotes>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...VotesQuery,
            variables: {
                id,
                first,
                orderBy: 'created',
                orderDirection: 'desc',
                skip,
            },
        }),
        context: c,
    });

    const votes = votesResponse.data.votes;

    if (votes.length === 0) {
        return { votes: [] };
    }

    const usersResponse = await fetchJson<SnapshotUsers>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...UsersQuery,
            variables: {
                addresses: votes.map((vote) => vote.voter),
            },
        }),
        context: c,
    });

    const results = votes.map<SnapshotVote>((vote) => {
        const user = usersResponse.data.users.find((user) => isSameAddress(user.id, vote.voter));
        return {
            ...vote,
            voterDetail: user,
        };
    });

    return {
        votes: results,
        nextSkip: results.length === first ? skip + first : undefined,
    };
}
