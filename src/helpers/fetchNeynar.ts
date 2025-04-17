import { fetchJSON } from '@/helpers/fetchJSON.js';
import { type NextFetchersOptions } from '@/helpers/getNextFetchers.js';

export function fetchNeynarJSON<T>(url: string, init?: RequestInit, options?: NextFetchersOptions): Promise<T> {
    return fetchJSON(
        url,
        {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...init?.headers,
            },
        },
        options,
    );
}

export function fetchNeynarStream<T>(url: string, init?: RequestInit, options?: NextFetchersOptions): Promise<T> {
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
