import { SnapshotState } from '@/constants/enum.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';

export function getProposalState(proposal: SnapshotProposal) {
    if (proposal.state === SnapshotState.Closed) {
        if (proposal.scores_total < proposal.quorum) return SnapshotState.Rejected;
        return proposal.type !== 'basic' || proposal.scores[0] > proposal.scores[1]
            ? SnapshotState.Passed
            : SnapshotState.Rejected;
    }

    return proposal.state;
}
