import { bom, parseUrl } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { FetchError, NetworkError } from '@/constants/error.js';
import { FIREFLY_USER_AGENT, SITE_URL, SITE_URL_OFFICIAL } from '@/constants/index.js';
import { addHeaders } from '@/helpers/addHeader.js';
import { getNextFetchers, type NextFetchersOptions } from '@/helpers/getNextFetchers.js';
import type { Fetcher } from '@/types/utility.js';

const { fetch: originalFetch } = globalThis;

function isFireflyApi(url: URL) {
    return [
        'https://api.firefly.land',
        'https://api-dev.firefly.land',
        'https://stamp.firefly.land',
        'https://stamp-dev.firefly.land',
        'https://media.firefly.land',
        'https://mask-network.firefly.land',
        'https://mask-network-dev.firefly.land',
    ].includes(url.origin);
}

function defaultFetcher(input: RequestInfo | URL, init?: RequestInit | undefined) {
    const u = input instanceof URL ? input : parseUrl(typeof input === 'string' ? input : input.url);

    return originalFetch(input, {
        signal: AbortSignal.timeout(3 * 60 * 1000 /* 3 mins */),
        ...init,
        headers:
            u && isFireflyApi(u) && isServer
                ? addHeaders(init?.headers ?? {}, {
                      Referer: SITE_URL_OFFICIAL,
                      'User-Agent': FIREFLY_USER_AGENT,
                  })
                : init?.headers,
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
