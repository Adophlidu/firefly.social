/**
 * Accept a promise and then set a timeout on it. After `time` ms, it will reject.
 * Useful for preventing promises from hanging indefinitely
 *
 * @param promise - The promise that you want to set time limit on
 * @param time - Time before timeout in milliseconds
 * @param rejectReason - When reject, show a reason. Defaults to "timeout"
 * @returns Promise that either resolves with the original promise or rejects with timeout error
 *
 * @example
 * ```typescript
 * // Timeout after 5 seconds
 * const result = await timeout(
 *   fetch('/api/data'),
 *   5000,
 *   'API request timeout'
 * );
 * ```
 */
export function timeout<T>(promise: PromiseLike<T>, time: number, rejectReason?: string): Promise<T> {
    if (!Number.isFinite(time)) return (async () => promise)();
    let timer: NodeJS.Timeout;
    const race = Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error(rejectReason ?? 'timeout')), time);
        }),
    ]);
    race.finally(() => clearTimeout(timer));
    return race;
}
