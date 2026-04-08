import { bom, ForbiddenError, NetworkError, parseUrl } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { FetchError } from '@/constants/error';
import { FIREFLY_USER_AGENT, SITE_URL } from '@/constants/static';
import { addHeaders } from '@/helpers/addHeader';

const { fetch: originalFetch } = globalThis;
const isServer = false;

function isFireflyApi(url: URL) {
    return [
        'https://api.firefly.land',
        'https://api-dev.firefly.land',
        'https://stamp.firefly.land',
        'https://stamp-dev.firefly.land',
        'https://mask-network.firefly.land',
        'https://mask-network-dev.firefly.land',
    ].includes(url.origin);
}

function isFireflyLandApi(url: URL) {
    return ['https://api.firefly.land', 'https://api-dev.firefly.land'].includes(url.origin);
}

function isStaticMedia(url: URL) {
    // Static S3 content doesn't need API headers
    return ['https://media.firefly.land'].includes(url.origin);
}

function resolveRequestUrl(input: RequestInfo | URL) {
    if (input instanceof URL) return input;

    const urlFromInput = input instanceof Request ? input.url : input;
    const url = isServer && urlFromInput.startsWith('/') ? urlcat(SITE_URL, urlFromInput) : urlFromInput;
    return parseUrl(url, { autoFixProtocol: false });
}

function patchServerHeaders(headers: HeadersInit | undefined, u: URL) {
    const fireflyHeaders = isFireflyApi(u)
        ? {
              Referer: SITE_URL,
              'User-Agent': FIREFLY_USER_AGENT,
          }
        : null;

    return addHeaders(headers ?? {}, {
        ...fireflyHeaders,
    });
}

function defaultFetcher(input: RequestInfo | URL, init?: RequestInit | undefined) {
    const u = resolveRequestUrl(input);
    return originalFetch(input, {
        signal: AbortSignal.timeout(3 * 60 * 1000 /* 3 mins */),
        ...init,
        headers: u && isServer ? patchServerHeaders(init?.headers, u) : init?.headers,
    });
}

export interface NextFetchersOptions {
    /** Label the request as static media */
    forceStaticMedia?: boolean;
    /** Threat non-2?? as valid response */
    noStrictOK?: boolean;
    /** Avoid adding a content-type when fetching JSON. */
    noDefaultContentType?: boolean;
}

async function executeFetch(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    options: NextFetchersOptions | undefined,
    u: URL | null,
): Promise<Response> {
    let response: Response;

    try {
        response = await defaultFetcher(u ?? input, init);
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new NetworkError(error.message);
        }
        throw error;
    }

    // If the request is not successful and the network is offline, throw a network error
    if (!response.ok && bom.navigator?.onLine === false) throw new NetworkError();

    // On client side, the <AuthGuard /> warning will be triggered when a firefly api request is 403 forbidden
    if (response.status === 403 && bom.document && u && isFireflyLandApi(u)) {
        throw new ForbiddenError();
    }

    // If the request is not successful and the noStrictOK option is not set, throw a fetch error
    if (!response.ok && !options?.noStrictOK) {
        const fetchError = FetchError.from(u ?? input, response, '');
        fetchError.toThrow();
    }
    return response;
}

export async function fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: NextFetchersOptions,
): Promise<Response> {
    const u = resolveRequestUrl(input);

    // For static media, use native fetch directly to avoid unnecessary overhead
    if ((u && isStaticMedia(u)) || options?.forceStaticMedia) {
        if (!options?.forceStaticMedia) {
            // warning
        }
        return originalFetch(input, init);
    }

    return executeFetch(input, init, options, u);
}
