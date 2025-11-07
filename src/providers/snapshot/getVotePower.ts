import { SNAPSHOT_SCORES_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { SnapshotStrategy } from '@/providers/snapshot/type.js';

export async function getVotePower(
    address: string,
    network: string,
    strategies: SnapshotStrategy[],
    snapshot: number | 'latest',
    space: string,
    delegation: boolean,
) {
    const response = await fetchJson<{ result: { vp: number; vp_by_strategy: number[]; vp_state: string } }>(
        SNAPSHOT_SCORES_URL,
        {
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
        },
    );

    return response.result;
}
