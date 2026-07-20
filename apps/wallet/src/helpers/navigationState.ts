/**
 * In-memory handoff for navigation state. Replaces TanStack Router's history
 * `state`, which @dimensiondev/ssr does not support: set the payload right
 * before `navigate()`, read it on the target page.
 *
 * Entries are keyed by target pathname and never expire within the session —
 * unlike TanStack's per-history-entry state, a direct revisit of the same
 * path later in the session may still see a stale payload.
 */
const stateByPath = new Map<string, unknown>();

export function setNavigationState(path: string, state: unknown): void {
    stateByPath.set(path, state);
}

export function getNavigationState<T>(path: string): T | undefined {
    return stateByPath.get(path) as T | undefined;
}
