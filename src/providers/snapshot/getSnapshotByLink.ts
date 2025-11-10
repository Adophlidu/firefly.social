import type { Address } from 'viem';

import { getSnapshotByLink as getSnapshotByLinkService } from '@/providers/firefly/worker/getSnapshotByLink.js';
import { deserializeSnapshotProposal } from '@/providers/snapshot/deserializeSnapshotProposal.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';

async function getSnapshotByLink(link: string, address: Address): Promise<SnapshotProposal | undefined> {
    const proposal = await getSnapshotByLinkService(link);
    if (!proposal) return;
    return deserializeSnapshotProposal(proposal, address);
}
