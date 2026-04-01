import { delay } from '@/delay.js';

export async function retryOnError<P>(
    retries: number,
    cond: (err: unknown) => boolean,
    fn: () => Promise<P>,
    interval = 0,
): Promise<P> {
    let lastErr: unknown;
    while (retries > 0) {
        try {
            return await fn();
        } catch (e: unknown) {
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
