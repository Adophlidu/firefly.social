import { bom, parseUrl } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { FetchError, ForbiddenError, NetworkError } from '@/constants/error.js';
import { EVENT_FORBIDDEN } from '@/constants/event.js';
import { FIREFLY_USER_AGENT, SITE_URL, SITE_URL_OFFICIAL } from '@/constants/index.js';
import { addHeaders } from '@/helpers/addHeader.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';

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

function isFireflyLandApi(url: URL) {
    return ['https://api.firefly.land', 'https://api-dev.firefly.land'].includes(url.origin);
}

function resolveRequestUrl(input: RequestInfo | URL) {
    return input instanceof URL ? input : parseUrl(typeof input === 'string' ? input : input.url);
}

function resolveRequestInput(input: RequestInfo | URL) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : undefined;
    return isServer && url?.startsWith('/') ? urlcat(SITE_URL, url) : input;
}

function defaultFetcher(input: RequestInfo | URL, init?: RequestInit | undefined) {
    const u = resolveRequestUrl(input);
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
export interface NextFetchersOptions {
    /** Threat non-2?? as valid response */
    noStrictOK?: boolean;
    /** Avoid adding a content-type when fetching JSON. */
    noDefaultContentType?: boolean;
    /** Generates an unequal request key. Requests that share the same key will be squashed into a single one. */
    resolver?: (request: Request) => Promise<string>;
}

export async function fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<Response> {
    const requestInput = resolveRequestInput(input);
    const response = await defaultFetcher(requestInput, init);
    if (!response.ok && bom.navigator?.onLine === false) throw new NetworkError();

    // on client the <AuthGuard /> warning will be triggered when a firefly api request is 403 forbidden
    if (response.status === 403 && bom.document) {
        const u = resolveRequestUrl(input);
        if (u && isFireflyLandApi(u)) {
            dispatchCustomEvent(EVENT_FORBIDDEN);
            throw new ForbiddenError();
        }
    }

    if (!response.ok && !options?.noStrictOK) {
        const fetchError = await FetchError.from(requestInput, response);
        fetchError.toThrow();
    }
    return response;
}
