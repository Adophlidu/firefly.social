import { bom } from '@firefly/utils';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { FetchError, NetworkError } from '@/constants/error.js';
import { SITE_URL } from '@/constants/index.js';
import { getNextFetchers, type NextFetchersOptions } from '@/helpers/getNextFetchers.js';
import type { Fetcher } from '@/types/utility.js';

const { fetch: originalFetch } = globalThis;

function defaultFetcher(input: RequestInfo | URL, init?: RequestInit | undefined) {
    return originalFetch(input, {
        signal: AbortSignal.timeout(3 * 60 * 1000 /* 3 mins */),
        ...init,
    });
}

function resolveRequestInput(input: RequestInfo | URL) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : undefined;
    return isServer && url?.startsWith('/') ? urlcat(SITE_URL, url) : input;
}

export async function fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<Response> {
    const fetchers = getNextFetchers(options);
    const fetcher = fetchers.reduceRight<Fetcher>((ff, f) => (r, i) => f(r, i, ff), defaultFetcher);

    const requestInput = resolveRequestInput(input);

    const response = await fetcher(requestInput, init);
    if (!response.ok && bom.navigator?.onLine === false) throw new NetworkError();
    if (!response.ok && !options?.noStrictOK) {
        const fetchError = await FetchError.from(requestInput, response);
        fetchError.toThrow();
    }
    return response;
}
