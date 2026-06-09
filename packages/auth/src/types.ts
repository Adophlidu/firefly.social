/**
 * Token-maintenance strategy:
 * - `auto`: detect the host from the native bridge (default).
 * - `web`: the shared storage (e.g. `localStorage`) is the source of truth.
 * - `native`: tokens are obtained/maintained through the Firefly app bridge.
 */
export type FireflyAuthMode = 'auto' | 'web' | 'native';

/**
 * Minimal synchronous key/value storage abstraction.
 *
 * Mirrors the slice of the Web Storage API (`localStorage`) that this package
 * needs.  Consumers can supply their own adapter (e.g. an in-memory store, a
 * cross-origin bridge, or an encrypted backing store) via {@link FireflyAuthConfig.storage}.
 */
export interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/** The v3 JWT token data persisted alongside a Firefly session. */
export interface JwtPayload {
    /** Firefly JWT v3 access token (short TTL). The bearer token consumers use. */
    accessToken?: string;
    /** Firefly JWT v3 refresh token (longer TTL, rotated on every use). */
    refreshToken?: string;
    /** Session ID for client-side tracking. Not used in auth headers. */
    sessionId?: string;
}

/**
 * A decoded snapshot of the current Firefly profile session as it exists in
 * storage at a point in time.
 */
export interface FireflySnapshot {
    /** Numeric Firefly profile id from the session body. */
    profileId: string;
    /** Legacy v1 bearer token; the fallback before a v3 upgrade lands. */
    legacyToken: string;
    /** Absolute access-token expiry (ms epoch); `0` when unknown (legacy). */
    expiresAt: number;
    /** v3 token data, or `null` for a legacy-only session. */
    jwt: JwtPayload | null;
    /** The raw serialized `currentProfileSession` string this snapshot came from. */
    raw: string;
}

/** A listener notified whenever the freshest access token changes. */
export type AccessTokenListener = (accessToken: string | null) => void;
