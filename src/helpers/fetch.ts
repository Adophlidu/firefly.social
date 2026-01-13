import { bom, ForbiddenError, NetworkError, parseUrl } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FetchError, NftScanError } from '@/constants/error.js';
import { EVENT_FORBIDDEN } from '@/constants/event.js';
import { FIREFLY_USER_AGENT, SITE_URL, SITE_URL_OFFICIAL } from '@/constants/static.js';
import { addHeaders } from '@/helpers/addHeader.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { getResponseText } from '@/helpers/getResponseText.js';
import { logger } from '@/libs/Logger.js';

const { fetch: originalFetch } = globalThis;

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
              Referer: SITE_URL_OFFICIAL,
              'User-Agent': FIREFLY_USER_AGENT,
          }
        : null;
    const bypassHeaders = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
        ? {
              'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          }
        : null;

    return addHeaders(headers ?? {}, {
        ...fireflyHeaders,
        ...bypassHeaders,
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
        dispatchCustomEvent(EVENT_FORBIDDEN);
        throw new ForbiddenError();
    }

    // If the request is not successful and the noStrictOK option is not set, throw a fetch error
    if (!response.ok && !options?.noStrictOK) {
        const text = await getResponseText(response);
        if (u && isFireflyLandApi(u) && text.includes('nftscan get fail')) throw new NftScanError();

        const fetchError = FetchError.from(u ?? input, response, text);
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
            logger.warn(
                `[fetch] try to fetch a static media (url=${u?.toString()}), better use the native fetch directly to avoid unnecessary overhead.`,
            );
        }
        return originalFetch(input, init);
    }

    // Wrap fetch call with performance tracking if enabled
    // Only import and use performance tracking if the feature is enabled
    // Check env variable synchronously first to avoid any module loading when disabled
    if (env.external.NEXT_PUBLIC_API_PERFORMANCE_PROFILING === STATUS.Enabled) {
        // Dynamic import to avoid loading the module when disabled
        // This is safe because we've already checked the env variable synchronously
        const performanceModule = await import('@/providers/lcp/tracker.js');
        const urlString =
            u?.toString() || (typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
        if (performanceModule.isTrackingEnabled()) {
            return performanceModule.trackApiCall(urlString, init, () => executeFetch(input, init, options, u));
        }
    }

    // Original fetch logic without tracking
    return executeFetch(input, init, options, u);
}
