import { DEFAULT_ACCESS_TOKEN_TTL_MS } from '@/internal/jwt.js';
import type { FireflyAuthMode, FireflyAuthPolicy, StorageAdapter } from '@/types.js';

/** Production Firefly API root. The refresh endpoint lives under `/v3/auth`. */
const DEFAULT_FIREFLY_ROOT_URL = 'https://api.firefly.land';

/** Refresh the access token this many ms before it actually expires. */
const DEFAULT_PROACTIVE_REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/** localStorage key the Firefly app persists its profile/session store under. */
const DEFAULT_STORAGE_KEY = 'firefly-state';

/**
 * Network timeout (ms) for a token rotation request. Bounds how long the
 * origin-wide rotation lock is held, so a hung refresh in one sub-site cannot
 * block token access in the others. Generous on purpose: aborting an in-flight
 * rotation that already rotated server-side would strand the (single-use)
 * refresh token.
 */
const DEFAULT_REQUEST_TIMEOUT_MS = 30 * 1000; // 30 seconds

/** User-facing options for {@link FireflyAuthClient}; every field is optional. */
export interface FireflyAuthClientOptions {
    /**
     * Token-maintenance strategy. `'auto'` (default) detects the host from the
     * native bridge (`'native'` inside the Firefly app webview, `'web'`
     * otherwise); `'web'` / `'native'` force a strategy and skip detection.
     */
    mode?: FireflyAuthMode;
    /** Firefly API root URL (no trailing slash required). Default: production. */
    fireflyRootUrl?: string;
    /** Access-token TTL used to derive expiry from `issued_at_ms`. Default: 15m. */
    accessTokenTtlMs?: number;
    /** How long before expiry a proactive refresh kicks in. Default: 10m. */
    proactiveRefreshThresholdMs?: number;
    /** Storage key holding the serialized Firefly profile store. Default: `firefly-state`. */
    storageKey?: string;
    /**
     * Backing storage for the Firefly session.  Defaults to the ambient
     * `localStorage` (shared across every `firefly.social/*` sub-site on the
     * same origin).  Supply a custom adapter to read/write the session from
     * somewhere else, or `null` to disable web storage entirely (native-only).
     */
    storage?: StorageAdapter | null;
    /**
     * Which access token to serve. `'auto'` (default) upgrades a legacy-only
     * session to JWT v3 and otherwise uses the existing v3 token; `'jwt'` uses
     * only the v3 token; `'legacy'` uses only the legacy token (as-is).
     */
    policy?: FireflyAuthPolicy;
    /**
     * Network timeout (ms) for a token rotation request. Bounds how long the
     * origin-wide rotation lock is held across sub-sites. Default: 30s.
     */
    requestTimeoutMs?: number;
    /**
     * Extra headers sent with the Firefly token-rotation requests
     * (`refreshJWT` / `exchangeLegacyJWT`). Entries with an `undefined` value
     * are dropped, so e.g. `process.env.X` is safe to pass directly.
     */
    headers?: Record<string, string | undefined>;
    /** Emit verbose `info` logs. Warnings/errors are always logged. Default: false. */
    debug?: boolean;
}

/** Fully-resolved configuration with every default applied. */
export interface ResolvedConfig {
    mode: FireflyAuthMode;
    fireflyRootUrl: string;
    accessTokenTtlMs: number;
    proactiveRefreshThresholdMs: number;
    storageKey: string;
    storage: StorageAdapter | null;
    policy: FireflyAuthPolicy;
    requestTimeoutMs: number;
    headers: Record<string, string | undefined>;
    debug: boolean;
}

/**
 * Resolve the default storage adapter: the ambient `localStorage` when present,
 * otherwise `null` (SSR / native webview / privacy-restricted contexts).
 */
function resolveDefaultStorage(): StorageAdapter | null {
    try {
        if (typeof localStorage === 'undefined') return null;
        return localStorage;
    } catch {
        // Accessing localStorage can throw (e.g. sandboxed iframes, blocked cookies).
        return null;
    }
}

/** Apply defaults to user options to produce the effective configuration. */
export function resolveConfig(options: FireflyAuthClientOptions = {}): ResolvedConfig {
    return {
        mode: options.mode ?? 'auto',
        fireflyRootUrl: options.fireflyRootUrl ?? DEFAULT_FIREFLY_ROOT_URL,
        accessTokenTtlMs: options.accessTokenTtlMs ?? DEFAULT_ACCESS_TOKEN_TTL_MS,
        proactiveRefreshThresholdMs: options.proactiveRefreshThresholdMs ?? DEFAULT_PROACTIVE_REFRESH_THRESHOLD_MS,
        storageKey: options.storageKey ?? DEFAULT_STORAGE_KEY,
        // Respect an explicit `null` (disable storage); only fall back when omitted.
        storage: options.storage !== undefined ? options.storage : resolveDefaultStorage(),
        policy: options.policy ?? 'auto',
        requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
        headers: options.headers ?? {},
        debug: options.debug ?? false,
    };
}
