import { retryOnError } from '@dimensiondev/utils';

const NETWORK_ERRORS = ['Abort', 'Network request failed', 'Failed to fetch', 'Load failed'];

function isNetworkError(e: unknown) {
    const str = String(e);

    return NETWORK_ERRORS.some((err) => str.includes(err));
}

export async function retryOnBskyWhenNetworkError<P>(retries: number, fn: () => Promise<P>): Promise<P> {
    return retryOnError(retries, isNetworkError, fn);
}
