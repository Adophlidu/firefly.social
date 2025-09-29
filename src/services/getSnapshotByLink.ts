import { SNAPSHOT_GRAPHQL_URL } from '@/constants/index.js';
import { SNAPSHOT_NEW_PROPOSAL_REGEXP, SNAPSHOT_PROPOSAL_REGEXP } from '@/constants/regexp.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { ProposalQuery } from '@/providers/snapshot/query.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';

export async function getSnapshotByLink(link: string) {
    if (!SNAPSHOT_PROPOSAL_REGEXP.test(link) && !SNAPSHOT_NEW_PROPOSAL_REGEXP.test(link)) return;
    const match = link.match(SNAPSHOT_PROPOSAL_REGEXP);
    const newMatch = link.match(SNAPSHOT_NEW_PROPOSAL_REGEXP);
    const id = match ? match[1] : newMatch ? newMatch[2] : null;
    if (!id) return;

    const { data } = await fetchJson<{ data: { proposal: SnapshotProposal } }>(SNAPSHOT_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({
            ...ProposalQuery,
            variables: {
                id,
            },
        }),
    });
    return data.proposal;
}
