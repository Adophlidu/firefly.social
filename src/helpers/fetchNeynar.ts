import { env } from '@/constants/env.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { type NextFetchersOptions } from '@/helpers/getNextFetchers.js';

const API_KEY_HEADER_NAME = 'x-api-key';

function patchApiKey(headers: HeadersInit) {
    if (env.internal.HUBBLE_TOKEN) {
        return {
            ...headers,
            [API_KEY_HEADER_NAME]: env.internal.HUBBLE_TOKEN,
        };
    }
    if (env.external.NEXT_PUBLIC_HUBBLE_TOKEN) {
        return {
            ...headers,
            [API_KEY_HEADER_NAME]: env.external.NEXT_PUBLIC_HUBBLE_TOKEN,
        };
    }

    throw new Error('token not found.');
}

export function fetchNeynarJSON<T>(url: string, init?: RequestInit, options?: NextFetchersOptions): Promise<T> {
    return fetchJSON(
        url,
        {
            ...init,
            headers: patchApiKey({
                'Content-Type': 'application/json',
                ...init?.headers,
            }),
        },
        options,
    );
}

export function fetchNeynarStream<T>(url: string, init?: RequestInit, options?: NextFetchersOptions): Promise<T> {
    return fetchJSON(
        url,
        {
            ...init,
            headers: patchApiKey({
                'Content-Type': 'application/octet-stream',
                ...init?.headers,
            }),
        },
        options,
    );
}
