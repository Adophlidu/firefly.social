import type { Context } from 'hono';

import { fetchJson } from '@/shared/src/helpers/fetchJson.js';

export function fetchJsonNoCache<T>(url: RequestInfo | URL, init?: RequestInit): Promise<T> {
    return fetchJson<T>(url, {
        ...init,
        headers: {
            ...init?.headers,
            'cache-control': 'no-cache',
        },
        context: {} as Context,
    });
}
