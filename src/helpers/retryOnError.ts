import { delay } from '@dimensiondev/utils';

export async function retryOnError<P>(
    retries: number,
    cond: (err: any) => boolean,
    fn: () => Promise<P>,
    interval = 0,
): Promise<P> {
    let lastErr;
    while (retries > 0) {
        try {
            return await fn();
        } catch (e: any) {
            lastErr = e;
            if (cond(e)) {
                if (interval > 0) await delay(interval);
                retries -= 1;
                continue;
            }
            throw e;
        }
    }

    throw lastErr;
}
