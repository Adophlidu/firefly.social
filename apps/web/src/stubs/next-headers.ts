/**
 * Stub for `next/headers`. Nothing in the app imports it anymore; the alias
 * exists only so that next-auth's App-Router branch (never executed — we use
 * its Pages-Router handler) resolves at bundle time.
 */
function outsideRequestScope(): never {
    throw new Error('`next/headers` is not available in the SSR app runtime.');
}

export const headers = outsideRequestScope;
export const cookies = outsideRequestScope;
