/**
 * Run `task` under an origin-wide exclusive lock so that, across every
 * `firefly.social/*` tab and sub-site, only one refresh rotates the
 * single-use refresh token at a time.
 *
 * Falls back to running unguarded when the Web Locks API is unavailable
 * (older webviews, SSR) — in-tab dedupe still applies via the shared promise.
 */
export function withTokenLock<T>(name: string, task: () => Promise<T>): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks) return task();
    return locks.request(name, task);
}
