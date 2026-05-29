import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { memoizePromiseWithTime } from '@/helpers/memoizePromise.js';
import type { ResponseJson } from '@/types/utility.js';

type TcoResponse = ResponseJson<{
    resolved: string;
}>;

export function isTcoLink(u: string) {
    return u.startsWith('https://t.co/') && u !== 'https://t.co/';
}

async function resolver(u: string): Promise<string | null> {
    if (!isTcoLink(u)) return null;
    const response = await fetchJson<TcoResponse>(
        urlcat(FIREFLY_WORKER_HOST, '/tco', {
            link: u,
        }),
    );
    if (!response.success) return null;
    return response.data.resolved;
}

/** Resolve a https://t.co/ link to it's real address. Cached for 1 hour. */
export const resolveTcoLink = memoizePromiseWithTime(resolver, (x) => x, { cacheTime: 3600 });
