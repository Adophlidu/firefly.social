import { Buffer } from 'node:buffer';

/**
 * Builds the `localStorage['firefly-state']` value that makes the Firefly web app boot
 * **logged-in + wallet-authorized**, with NO real backend token, OAuth, or Privy wallet iframe.
 *
 * Grounded in apps/web/src:
 * - `helpers/getSessionFromStorage.ts` — validates `firefly-state` against `ProfileStoreSchema`
 *   and parses `currentProfileSession` via `SessionFactory.createSession`. The Privy connector's
 *   `isAuthorized()` returns true whenever that session exists → wallet shows as connected.
 * - `providers/base/SessionFactory.ts` — the serialized FireflySession string format.
 * - `store/useProfileStore/useFireflyProfileStore.ts` — on rehydrate, if `currentProfileSession`
 *   is set, it resumes the session AND sets a dummy current profile, so we only need the session.
 *
 * The token is intentionally fake — the hermetic suite route-stubs every backend call, so the
 * fake token never reaches a real server.
 */
export interface SeedOptions {
    profileId?: string;
    /** Pass a fixed timestamp for deterministic runs; defaults to Date.now(). */
    nowMs?: number;
    /** Session lifetime; default 7 days. */
    ttlMs?: number;
}

export const FIREFLY_STATE_KEY = 'firefly-state';

function b64(json: string): string {
    return Buffer.from(json, 'utf8').toString('base64');
}

/**
 * Serialized FireflySession string. Format (SessionFactory.createSession):
 *   "Firefly:<base64 of {type,profileId,token,createdAt,expiresAt}>"
 * The remaining fragments (parent / signature / isNew / payload / jwt) are all optional, so the
 * minimal form is type + the base64 core.
 */
export function serializeFireflySession(opts: SeedOptions = {}): string {
    const now = opts.nowMs ?? Date.now();
    const core = {
        type: 'Firefly', // SessionType.Firefly
        profileId: opts.profileId ?? 'e2e-test-account',
        token: 'e2e-fake-token',
        createdAt: now,
        expiresAt: now + (opts.ttlMs ?? 7 * 24 * 60 * 60 * 1000),
    };
    return `Firefly:${b64(JSON.stringify(core))}`;
}

/**
 * The full `firefly-state` localStorage value (matches `ProfileStoreSchema`). `version: 0` because
 * the store's persist config sets no explicit version; `status: 'idle'` is `AsyncStatus.Idle`.
 */
export function fireflyStateValue(opts: SeedOptions = {}): string {
    return JSON.stringify({
        state: {
            accounts: [],
            currentProfile: null,
            currentProfileSession: serializeFireflySession(opts),
            status: 'idle',
        },
        version: 0,
    });
}
