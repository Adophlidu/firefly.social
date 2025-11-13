import { SnapshotState } from '@/constants/enum.js';
import { SNAPSHOT_GRAPHQL_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { pathQueryVoteResultsByVoter } from '@/providers/snapshot/pathQueryVoteResultsByVoter.js';
import { ProposalsQuery } from '@/providers/snapshot/query.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';

function getProposalState(proposal: SnapshotProposal) {
    if (proposal.state === SnapshotState.Closed) {
        if (proposal.scores_total < proposal.quorum) return SnapshotState.Rejected;
        return proposal.type !== 'basic' || proposal.scores[0] > proposal.scores[1]
            ? SnapshotState.Passed
            : SnapshotState.Rejected;
    }

    return proposal.state;
}

export async function getProposals(ids: string[], address?: string) {
    const response = await fetchJson<{ data: { proposals: SnapshotProposal[] } }>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...ProposalsQuery,
            variables: {
                id_in: ids,
                first: 20,
            },
        }),
    });

    if (!response.data.proposals) return [];

    if (!address) return response.data.proposals;

    const votes = await pathQueryVoteResultsByVoter(ids, address);

    const proposals = response.data.proposals.map((proposal) => {
        const target = votes.data.find((vote) => vote.proposal.id === proposal.id);
        return {
            ...proposal,
            state: getProposalState(proposal),
            currentUserChoice: target?.choice,
        };
    });

    return proposals;
}
