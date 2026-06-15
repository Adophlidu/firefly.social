import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import { snapshotWorker } from '@dimensiondev/workers-client';
import { isNumber } from 'lodash-es';

import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { SnapshotVote } from '@/providers/snapshot/type.js';
import type { ResponseJson } from '@/types/utility.js';

interface WorkerVotesResponse {
    votes: SnapshotVote[];
    nextSkip?: number;
}

export async function getVotesById(id: string, indicator?: PageIndicator) {
    const size = indicator?.size ?? 20;
    const skip = Number(indicator?.id ?? 0);

    const res = await snapshotWorker.snapshot.votes.$get({
        query: { id, skip: String(skip), first: String(size) },
    });
    const response = (await res.json()) as ResponseJson<WorkerVotesResponse>;

    const { votes, nextSkip } = resolveResponseData(response);

    const currentIndicator = createIndicator(indicator, skip.toString(), size);
    const nextIndicator = isNumber(nextSkip) ? createNextIndicator(indicator, nextSkip.toString(), size) : undefined;

    return createPageable(votes, currentIndicator, nextIndicator);
}
