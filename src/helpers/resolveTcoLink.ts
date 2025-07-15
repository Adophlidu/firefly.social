import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import type { ResponseJSON } from '@/types/index.js';
import urlcat from 'urlcat';

type TcoResponse = ResponseJSON<{
    resolved: string;
}>;

const cache = new Map<string, string>();

export function isTcoLink(u: string) {
    return u.startsWith('https://t.co/') && u !== 'https://t.co/';
}

async function resolver(u: string): Promise<string | null> {
    if (!isTcoLink(u)) return null;
    if (cache.has(u)) return cache.get(u) ?? null;
    const response = await fetchJSON<TcoResponse>(
        urlcat(FIREFLY_WORKER_HOST, '/tco', {
            link: u,
        }),
    );
    if (!response.success) return null;
    return response.data.resolved;
}

/** Resolve a https://t.co/ link to it's real address. */
export const resolveTcoLink = memoizePromise(resolver, (x) => x);
