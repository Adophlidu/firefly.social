import { last } from 'lodash-es';

import { getProposalState } from '@/providers/snapshot/getProposalState.js';
import { pathQueryVoteResultsByVoter } from '@/providers/snapshot/pathQueryVoteResultsByVoter.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';

export async function deserializeSnapshotProposal(snapshotProposal: SnapshotProposal, address: string) {
    const proposal = {
        ...snapshotProposal,
        state: getProposalState(snapshotProposal),
    };
    if (!address) return proposal;

    const votes = await pathQueryVoteResultsByVoter([snapshotProposal.id], address);

    const target = last(votes.data);
    if (!target) return proposal;

    return {
        ...proposal,
        currentUserChoice: target.choice,
    };
}
