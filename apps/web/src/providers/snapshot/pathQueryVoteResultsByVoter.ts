import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import { snapshotWorker } from '@dimensiondev/workers-client';

import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { SnapshotVotes } from '@/providers/snapshot/type.js';
import type { ResponseJson } from '@/types/utility.js';

interface WorkerVoteResultsResponse {
    votes: SnapshotVotes['data']['votes'];
    nextSkip?: number;
}

export async function pathQueryVoteResultsByVoter(ids: string[], voter: string, indicator?: PageIndicator) {
    if (!ids.length) return createPageable([], createIndicator(indicator));

    const size = indicator?.size ?? 20;
    const skip = Number(indicator?.id ?? 0);

    const res = await snapshotWorker.snapshot['vote-results'].$get({
        query: { ids: ids.join(','), voter, skip: String(skip), first: String(size) },
    });
    const response = (await res.json()) as ResponseJson<WorkerVoteResultsResponse>;

    const { votes, nextSkip } = resolveResponseData(response);

    const currentIndicator = createIndicator(indicator, skip.toString(), size);
    const nextIndicator =
        typeof nextSkip === 'number' ? createNextIndicator(indicator, nextSkip.toString(), size) : undefined;

    return createPageable(votes, currentIndicator, nextIndicator);
}
