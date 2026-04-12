import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { NeynarResponse } from '@/providers/types/Neynar.js';

export function fetchNeynarJson<T>(
    url: string,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<NeynarResponse<T>> {
    return fetchJson(
        url,
        {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...init?.headers,
            },
            mode: 'cors',
        },
        options,
    );
}
