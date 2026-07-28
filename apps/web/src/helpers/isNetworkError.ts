import { NetworkError } from '@dimensiondev/utils';

// Substrings of the raw `TypeError` browsers throw from `fetch()` when the
// request never reaches the server (connection dropped, CORS block, ad/script
// blocker, offline, etc.). These are transport failures, not protocol errors.
const NETWORK_ERRORS = ['Abort', 'Network request failed', 'Failed to fetch', 'Load failed'];

/**
 * Detects a transport-level network failure: the browser's raw `fetch()`
 * `TypeError` (e.g. "Failed to fetch", "Load failed", "Network request failed"),
 * an abort, or the app's own typed `NetworkError` thrown by the fetch wrapper
 * (`helpers/fetch.ts`). Returns false for HTTP 4xx/5xx and other protocol errors.
 */
export function isNetworkError(error: unknown) {
    if (error instanceof NetworkError) return true;
    const str = String(error);
    return NETWORK_ERRORS.some((err) => str.includes(err));
}
