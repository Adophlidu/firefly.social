import { retryOnError } from '@dimensiondev/utils';

import { isNetworkError } from '@/helpers/isNetworkError.js';

/**
 * Retries `fn` on transient Bluesky transport failures (the browser's raw
 * `fetch()` TypeError or the app's typed `NetworkError`). Non-network errors
 * (HTTP 4xx/5xx, protocol failures) are thrown immediately — only genuine
 * transport blips retry.
 *
 * Pass an `AbortSignal` to stop retrying once the caller has been cancelled
 * (e.g. the compose modal closing). Backward-compatible: the 2-arg form used by
 * login/session validation is unchanged.
 */
export async function retryOnBskyWhenNetworkError<P>(
    retries: number,
    fn: () => Promise<P>,
    signal?: AbortSignal,
): Promise<P> {
    return retryOnError(retries, (err) => isNetworkError(err) && !signal?.aborted, fn);
}
