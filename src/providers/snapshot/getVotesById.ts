import { isNumber } from 'lodash-es';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
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

    const response = await fetchJson<ResponseJson<WorkerVotesResponse>>(
        urlcat(FIREFLY_WORKER_HOST, '/snapshot/votes', {
            id,
            skip,
            first: size,
        }),
    );

    const { votes, nextSkip } = resolveResponseData(response);

    const currentIndicator = createIndicator(indicator, skip.toString(), size);
    const nextIndicator = isNumber(nextSkip) ? createNextIndicator(indicator, nextSkip.toString(), size) : undefined;

    return createPageable(votes, currentIndicator, nextIndicator);
}
