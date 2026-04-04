/**
 * Creates a function that deduplicates concurrent calls with the same key.
 * Unlike memoizePromise, results are not retained after the promise settles —
 * this only prevents multiple in-flight requests for the same key at once.
 */
export function createDeduplicatedFetch<T>() {
    const running = new Map<string, Promise<T>>();
    return function deduplicatedFetch(key: string, fn: () => Promise<T>): Promise<T> {
        if (!running.has(key)) {
            running.set(
                key,
                fn().finally(() => running.delete(key)),
            );
        }
        return running.get(key)!;
    };
}
