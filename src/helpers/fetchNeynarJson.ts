import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { NextFetchersOptions } from '@/helpers/getNextFetchers.js';
import type { NeynarResponse } from '@/providers/types/Neynar.js';

export function fetchNeynarJson<T>(
    url: string,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<NeynarResponse<T>> {
    return fetchJSON(
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

export function fetchNeynarStream<T>(
    url: string,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<NeynarResponse<T>> {
    return fetchJSON(
        url,
        {
            ...init,
            headers: {
                'Content-Type': 'application/octet-stream',
                ...init?.headers,
            },
        },
        options,
    );
}
