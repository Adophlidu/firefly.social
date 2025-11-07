import { SNAPSHOT_GRAPHQL_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { plus } from '@/helpers/number.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { UsersQuery, VotesQuery } from '@/providers/snapshot/query.js';
import type { SnapshotUsers, SnapshotVote, SnapshotVotes } from '@/providers/snapshot/type.js';

export async function getVotesById(id: string, indicator?: PageIndicator) {
    const votesResponse = await fetchJson<SnapshotVotes>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...VotesQuery,
            variables: {
                id,
                first: 20,
                orderBy: 'created',
                orderDirection: 'desc',
                skip: Number(indicator?.id ?? 0),
            },
        }),
    });

    const votes = votesResponse.data.votes;

    const usersResponse = await fetchJson<SnapshotUsers>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...UsersQuery,
            variables: {
                addresses: votes.map((vote) => vote.voter),
            },
        }),
    });

    const results = votes.map<SnapshotVote>((vote) => {
        const user = usersResponse.data.users.find((user) => isSameEthereumAddress(user.id, vote.voter));
        return {
            ...vote,
            voterDetail: user,
        };
    });

    return createPageable(
        results,
        createIndicator(indicator),
        results.length ? createNextIndicator(indicator, plus(indicator?.id ?? 0, 20).toString()) : null,
    );
}
