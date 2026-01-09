import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { type SnapshotStrategy } from '@/providers/snapshot/type.js';
import { type ResponseJson } from '@/types/utility.js';

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
    const response = await fetchJson<ResponseJson<VotePowerResult>>(
        urlcat(FIREFLY_WORKER_HOST, '/snapshot/vote-power', {
            address,
            network,
            strategies: JSON.stringify(strategies),
            snapshot,
            space,
            delegation,
        }),
    );

    return resolveResponseData(response);
}
