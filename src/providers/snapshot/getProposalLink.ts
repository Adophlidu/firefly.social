import type { SnapshotProposal } from '@/providers/snapshot/type.js';

export function getProposalLink(proposal: SnapshotProposal) {
    return `https://snapshot.box/#/s:${proposal.space.id}/proposal/${proposal.id}`;
}
