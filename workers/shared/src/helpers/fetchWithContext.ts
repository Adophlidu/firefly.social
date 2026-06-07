import type { Context } from 'hono';

import { FIREFLY_WORKER_URL } from '@/shared/src/constants/metadata.js';
import { parseUrl } from '@/shared/src/helpers/parseUrl.js';

const DEFAULT_UA = 'Mozilla/5.0 (compatible; Firefly/1.0)';

const VERCEL_PROTECTION_BYPASS = 'p3KZ9yR2tFbM6XcV7dN1wQ8eL4uH0jTg';

export async function fetchWithContext(input: RequestInfo | URL, init: RequestInit & { context: Context }) {
    const mergedHeaders = new Headers();

    // Step 1: Headers from `Request` if input is a Request
    if (input instanceof Request) {
        input.headers.forEach((value, key) => {
            mergedHeaders.set(key, value);
        });
    }

    // Step 2: Headers from context.req.raw.headers (if present)
    if (init.context?.req?.raw?.headers) {
        init.context.req.raw.headers.forEach((value, key) => {
            mergedHeaders.set(key, value);
        });
    }

    // Step 3: Headers from init.headers (takes highest precedence)
    const initHeaders = new Headers(init.headers);
    initHeaders.forEach((value, key) => {
        mergedHeaders.set(key, value);
    });

    // Step 4: Ensure Content-Type is set
    if (!mergedHeaders.has('Content-Type')) {
        mergedHeaders.set('Content-Type', 'application/json');
    }

    // Step 5: Override UA
    mergedHeaders.set('User-Agent', DEFAULT_UA);

    // Step 6: Override Referer
    mergedHeaders.set('Referer', FIREFLY_WORKER_URL);

    // Extract URL for hostname check
    const url = input instanceof URL ? input : input instanceof Request ? parseUrl(input.url) : parseUrl(input);
    const isFireflyTest =
        url &&
        (url.hostname.endsWith('.firefly.social') ||
            (url.hostname.includes('firefly') && url.hostname.endsWith('.vercel.app')));
    if (isFireflyTest) {
        mergedHeaders.set('x-vercel-protection-bypass', VERCEL_PROTECTION_BYPASS);
    }

    return fetch(input, {
        ...init.context?.req?.raw,
        ...init,
        headers: mergedHeaders,
    });
}
