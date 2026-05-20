import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { ResponseJson } from '@/types/utility.js';

export async function getProposals(ids: string[]) {
    if (!ids.length) return [];

    const response = await fetchJson<ResponseJson<SnapshotProposal[]>>(
        urlcat(FIREFLY_WORKER_HOST, '/snapshot/proposals', {
            ids: ids.join(','),
        }),
    );

    return resolveResponseData(response);
}
