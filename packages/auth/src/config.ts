import type { FireflyAuthMode, StorageAdapter } from '@/types.js';

/** Production Firefly API root. The refresh endpoint lives under `/v3/auth`. */
const DEFAULT_FIREFLY_ROOT_URL = 'https://api.firefly.land';

/**
 * Firefly JWT v3 access-token TTL in milliseconds.  The access token itself
 * carries `issued_at_ms`; absolute expiry is `issued_at_ms + ttl`.
 */
const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Refresh the access token this many ms before it actually expires. */
const DEFAULT_PROACTIVE_REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/** localStorage key the Firefly app persists its profile/session store under. */
const DEFAULT_STORAGE_KEY = 'firefly-state';

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
        debug: options.debug ?? false,
    };
}
