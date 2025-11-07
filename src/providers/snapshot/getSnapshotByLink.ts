import type { Address } from 'viem';

import { deserializeSnapshotProposal } from '@/providers/snapshot/deserializeSnapshotProposal.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import { getSnapshotByLink as getSnapshotByLinkService } from '@/services/getSnapshotByLink.js';

async function getSnapshotByLink(link: string, address: Address): Promise<SnapshotProposal | undefined> {
    const proposal = await getSnapshotByLinkService(link);
    if (!proposal) return;
    return deserializeSnapshotProposal(proposal, address);
}
