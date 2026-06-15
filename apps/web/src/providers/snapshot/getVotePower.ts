import { snapshotWorker } from '@dimensiondev/workers-client';

import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { SnapshotStrategy } from '@/providers/snapshot/type.js';
import type { ResponseJson } from '@/types/utility.js';

interface VotePowerResult {
    vp: number;
    vp_by_strategy: number[];
    vp_state: string;
}

export async function getVotePower(
    address: string,
    network: string,
    strategies: SnapshotStrategy[],
    snapshot: number | 'latest',
    space: string,
    delegation: boolean,
) {
    const res = await snapshotWorker.snapshot['vote-power'].$get({
        query: {
            address,
            network,
            strategies: JSON.stringify(strategies),
            snapshot: String(snapshot),
            space,
            delegation: String(delegation),
        },
    });
    const response = (await res.json()) as ResponseJson<VotePowerResult>;

    return resolveResponseData(response);
}
