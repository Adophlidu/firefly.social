import { snapshotWorker } from '@dimensiondev/workers-client';

import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { ResponseJson } from '@/types/utility.js';

export async function getProposals(ids: string[]) {
    if (!ids.length) return [];

    const res = await snapshotWorker.snapshot.proposals.$get({
        query: { ids: ids.join(',') },
    });
    const json = (await res.json()) as ResponseJson<SnapshotProposal[]>;

    return resolveResponseData(json);
}
