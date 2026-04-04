import { fetch, type NextFetchersOptions } from '@/helpers/fetch.js';

export async function fetchJson<T = unknown>(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<T> {
    const { noDefaultContentType = false } = options ?? {};

    const response = await fetch(
        input,
        {
            ...init,
            headers: noDefaultContentType
                ? init?.headers
                : {
                      'Content-Type': 'application/json',
                      ...init?.headers,
                  },
        },
        options,
    );
    return response.json();
}
