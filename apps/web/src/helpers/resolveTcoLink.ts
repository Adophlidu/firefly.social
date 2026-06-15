import { tcoWorker } from '@dimensiondev/workers-client';

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
    const res = await tcoWorker.tco.$get({ query: { link: u } });
    const response = (await res.json()) as TcoResponse;
    if (!response.success) return null;
    return response.data.resolved;
}

/** Resolve a https://t.co/ link to it's real address. Cached for 1 hour. */
export const resolveTcoLink = memoizePromiseWithTime(resolver, (x) => x, { cacheTime: 3600 });
