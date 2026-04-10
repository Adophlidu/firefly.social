import { AbortError, InvalidAddressError, XRPCNotSupportedError } from '@/error.js';

export interface RunInSafeOptions<T> {
    /** If false, rethrow any error. Default: true */
    noThrow?: boolean;
    /** Returned when an error is swallowed. */
    defaultValue?: T;
    /** Called when an error is swallowed (and not ignored). */
    onError?: (error: unknown) => void;
}

export function runInSafe<T>(fn: () => T, options: RunInSafeOptions<T> = {}): T | undefined {
    const { noThrow = true, defaultValue, onError } = options;
    try {
        return fn();
    } catch (error) {
        if (!noThrow) throw error;
        onError?.(error);
        return defaultValue;
    }
}

export interface RunInSafeAsyncOptions {
    /** If false, rethrow any error. Default: true */
    noThrow?: boolean;
    /** Abort signal forwarded to `fn`. */
    signal?: AbortSignal;
    /**
     * Return early without calling `onError`. Defaults to silencing AbortError,
     * InvalidAddressError, and XRPCNotSupportedError. Pass a custom predicate to
     * override the default set.
     */
    shouldIgnoreError?: (error: unknown) => boolean;
    /** Called when an error is swallowed (and not ignored). */
    onError?: (error: unknown) => void;
}

function defaultShouldIgnoreError(error: unknown): boolean {
    return AbortError.is(error) || error instanceof InvalidAddressError || XRPCNotSupportedError.is(error);
}

export async function runInSafeAsync<T>(
    fn: (signal?: AbortSignal) => Promise<T>,
    { noThrow = true, signal, shouldIgnoreError = defaultShouldIgnoreError, onError }: RunInSafeAsyncOptions = {},
): Promise<T | undefined> {
    try {
        return await fn(signal);
    } catch (error) {
        if (shouldIgnoreError(error)) return;
        if (!noThrow) throw error;
        onError?.(error);
        return;
    }
}
