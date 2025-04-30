const NETWORK_ERRORS = ['Abort', 'Network request failed', 'Failed to fetch', 'Load failed'];

function isNetworkError(e: unknown) {
    const str = String(e);

    return NETWORK_ERRORS.some((err) => str.includes(err));
}

async function retry<P>(retries: number, cond: (err: any) => boolean, fn: () => Promise<P>): Promise<P> {
    let lastErr;
    while (retries > 0) {
        try {
            return await fn();
        } catch (e: any) {
            lastErr = e;
            if (cond(e)) {
                retries -= 1;
                continue;
            }
            throw e;
        }
    }
    throw lastErr;
}

export async function retryOnBskyWhenNetworkError<P>(retries: number, fn: () => Promise<P>): Promise<P> {
    return retry(retries, isNetworkError, fn);
}
