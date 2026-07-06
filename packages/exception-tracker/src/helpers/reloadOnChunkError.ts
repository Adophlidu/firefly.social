import { isChunkLoadError } from '@/helpers/classifyError.js';

/**
 * Per-tab, survives-reload guard key. sessionStorage is scoped to the tab and
 * persists across a `location.reload()`, so it lets us reload at most once per
 * failure cycle without looping.
 */
const CHUNK_RELOAD_GUARD_KEY = 'firefly:chunk-reload-attempted';

/**
 * True when a reload was already attempted for the current failure cycle.
 * All storage access is guarded because sessionStorage can throw in private
 * mode or when storage is disabled.
 */
function hasReloadGuard(): boolean {
    try {
        return sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Persists the guard and confirms it stuck by reading it back. Returns false
 * when storage is unavailable — a reload we cannot record would loop forever,
 * so callers must NOT reload unless this returns true.
 */
function setReloadGuard(): boolean {
    try {
        sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
        return sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Removes the guard. MUST be called on a confirmed successful client render so
 * a later genuine chunk failure can also recover once; otherwise the first-ever
 * reload permanently disables the mechanism for the tab.
 */
export function clearChunkReloadGuard(): void {
    try {
        sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
    } catch {
        // ignore (private mode / disabled storage)
    }
}

/**
 * Recovers from a transient ChunkLoadError by reloading the page exactly once
 * per failure cycle.
 *
 * - Returns false (does nothing) off the server or for non-chunk errors.
 * - Returns false if a reload was already attempted (guard set) — the caller
 *   should render a minimal, indexable fallback instead of reloading again.
 * - Otherwise persists the guard and reloads, returning true. If persisting the
 *   guard fails (storage disabled) it does NOT reload, to stay loop-safe.
 */
export function reloadOnceForChunkError(error: Error | string): boolean {
    if (typeof window === 'undefined') return false;
    if (!isChunkLoadError(error)) return false;

    // A reload was already attempted this cycle: don't loop. Let the caller
    // fall through to a fallback render.
    if (hasReloadGuard()) return false;

    // Persist the guard BEFORE reloading; bail if it can't be recorded.
    if (!setReloadGuard()) return false;

    window.location.reload();
    return true;
}
