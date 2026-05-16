import { AbortError } from '@/shared/src/constants/error.js';

export function runInSafe<T>(fn: () => T, noThrow = true, defaultValue?: T) {
    try {
        return fn();
    } catch (error) {
        if (!noThrow) throw error;
        console.error(`[runInSafe] ${error}`);
        return defaultValue;
    }
}

interface RunInSafeAsyncOptions {
    noThrow?: boolean;
    signal?: AbortSignal;
}

export async function runInSafeAsync<T>(
    fn: (signal?: AbortSignal) => Promise<T>,
    { noThrow = true, signal }: RunInSafeAsyncOptions = {},
) {
    try {
        return await fn(signal);
    } catch (error) {
        if (AbortError.is(error)) return;

        if (!noThrow) throw error;
        console.error(`[runInSafeAsync] ${(error as Error).message}`, error);
        return;
    }
}
