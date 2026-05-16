import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import type { Context } from 'hono';

import { SNAPSHOT_SCORES_URL } from '@/snapshot/src/constants.js';
import type { SnapshotStrategy } from '@/snapshot/src/types.js';

export interface VotePowerResult {
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
    c: Context,
): Promise<VotePowerResult> {
    const response = await fetchJson<{ result: VotePowerResult }>(SNAPSHOT_SCORES_URL, {
        method: 'POST',
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'get_vp',
            params: {
                address,
                network,
                strategies,
                snapshot,
                space,
                delegation,
            },
        }),
        context: c,
    });

    return response.result;
}
