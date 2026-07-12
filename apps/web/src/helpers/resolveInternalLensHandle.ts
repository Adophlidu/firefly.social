/**
 * Derive the handle of the internally-registered (managed) Lens account for a
 * Firefly user — the auto-created `ff-<uid>` account used as the default
 * Orb/FIFA comment author (FW-7852). Lower-cased to match Lens handle casing.
 *
 * Returns `undefined` when there is no uid (not logged in), so callers can use
 * it directly in equality checks without a separate null guard.
 */
export function resolveInternalLensHandle(uid?: string | null): string | undefined {
    return uid ? `ff-${uid}`.toLowerCase() : undefined;
}
