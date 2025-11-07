import { SNAPSHOT_GRAPHQL_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { plus } from '@/helpers/number.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { VotesQuery } from '@/providers/snapshot/query.js';
import type { SnapshotVotes } from '@/providers/snapshot/type.js';

export async function pathQueryVoteResultsByVoter(ids: string[], voter: string, indicator?: PageIndicator) {
    const votesResponse = await fetchJson<SnapshotVotes>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...VotesQuery,
            variables: {
                ids,
                voter,
                first: 20,
                skip: Number(indicator?.id ?? 0),
            },
        }),
    });

    const votes = votesResponse.data.votes;

    return createPageable(
        votes,
        createIndicator(indicator),
        createNextIndicator(indicator, plus(indicator?.id ?? 0, 20).toString()),
    );
}
