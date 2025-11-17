import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
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

    const response = await fetchJson<ResponseJson<WorkerVoteResultsResponse>>(
        urlcat(FIREFLY_WORKER_HOST, '/snapshot/vote-results', {
            ids: ids.join(','),
            voter,
            skip,
            first: size,
        }),
    );

    const { votes, nextSkip } = resolveResponseData(response);

    const currentIndicator = createIndicator(indicator, skip.toString(), size);
    const nextIndicator =
        typeof nextSkip === 'number' ? createNextIndicator(indicator, nextSkip.toString(), size) : undefined;

    return createPageable(votes, currentIndicator, nextIndicator);
}
