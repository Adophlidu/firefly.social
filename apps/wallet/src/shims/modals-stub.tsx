/**
 * SSR-only stub for `@/modals`. The modal roots statically pull in the
 * Privy/appkit/wagmi stack, which never renders during SSR (modals are
 * driven by client state) but would still occupy the worker artifact.
 */
export function Modals() {
    return null;
}
