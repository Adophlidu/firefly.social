import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import type { Context } from 'hono';

import { SNAPSHOT_GRAPHQL_URL } from '@/snapshot/src/constants.js';
import { ProposalQuery } from '@/snapshot/src/queries.js';
import { SNAPSHOT_NEW_PROPOSAL_REGEXP, SNAPSHOT_PROPOSAL_REGEXP } from '@/snapshot/src/regexp.js';
import type { SnapshotProposal } from '@/snapshot/src/types.js';

interface SnapshotProposalResponse {
    data: {
        proposal: SnapshotProposal;
    };
}

export async function getSnapshotFromUrl(link: string, c: Context) {
    if (!SNAPSHOT_PROPOSAL_REGEXP.test(link) && !SNAPSHOT_NEW_PROPOSAL_REGEXP.test(link)) return null;

    const matched = link.match(SNAPSHOT_PROPOSAL_REGEXP);
    const newMatched = link.match(SNAPSHOT_NEW_PROPOSAL_REGEXP);
    const id = matched ? matched[1] : newMatched ? newMatched[2] : null;
    if (!id) return null;

    const response = await fetchJson<SnapshotProposalResponse>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...ProposalQuery,
            variables: {
                id,
            },
        }),
        context: c,
    });
    return response.data.proposal;
}
