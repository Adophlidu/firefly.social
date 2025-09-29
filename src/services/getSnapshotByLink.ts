import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { SNAPSHOT_NEW_PROPOSAL_REGEXP, SNAPSHOT_PROPOSAL_REGEXP } from '@/constants/regexp.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';

export async function getSnapshotByLink(link: string) {
    if (!SNAPSHOT_PROPOSAL_REGEXP.test(link) && !SNAPSHOT_NEW_PROPOSAL_REGEXP.test(link)) return;

    const { data } = await fetchJson<{ data: { proposal: SnapshotProposal } }>(
        urlcat(FIREFLY_WORKER_HOST, '/snapshot', {
            url: link,
        }),
    );
    return data.proposal;
}
