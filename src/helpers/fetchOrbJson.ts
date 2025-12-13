import { env } from '@/constants/env.js';
import { SITE_URL } from '@/constants/static.js';
import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';

export function fetchOrbJson<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
    return fetchJson<T>(
        url,
        {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                'web-access-token': env.internal.ORB_API_KEY,
                origin: SITE_URL,
                ...init?.headers,
            },
        },
        options,
    );
}
