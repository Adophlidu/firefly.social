import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import type { Context } from 'hono';

import { SNAPSHOT_GRAPHQL_URL } from '@/snapshot/src/constants.js';
import { ProposalsQuery } from '@/snapshot/src/queries.js';
import type { SnapshotProposal } from '@/snapshot/src/types.js';
import { SnapshotState } from '@/snapshot/src/types.js';

function getProposalState(proposal: SnapshotProposal) {
    if (proposal.state === SnapshotState.Closed) {
        if (proposal.scores_total < proposal.quorum) return SnapshotState.Rejected;
        return proposal.type !== 'basic' || proposal.scores[0] > proposal.scores[1]
            ? SnapshotState.Passed
            : SnapshotState.Rejected;
    }

    return proposal.state;
}

export async function getProposals(ids: string[], c: Context): Promise<SnapshotProposal[]> {
    const response = await fetchJson<{ data: { proposals: SnapshotProposal[] } }>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...ProposalsQuery,
            variables: {
                id_in: ids,
                first: 20,
            },
        }),
        context: c,
    });

    if (!response.data.proposals) return [];

    return response.data.proposals.map((proposal) => ({
        ...proposal,
        state: getProposalState(proposal),
    }));
}
