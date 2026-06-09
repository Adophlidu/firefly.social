import type { AuthContext } from '@/internal/context.js';
import type { AccessTokenListener } from '@/types.js';

/** Origin-wide lock name that serializes JWT rotation across tabs and sub-sites. */
export const TOKEN_LOCK = 'firefly:jwt:token';

/**
 * Abstract Firefly session: owns the access-token concern and exposes only the
 * freshest token to consumers.
 *
 * Shared, environment-agnostic machinery lives here — subscriber fan-out and
 * single-flight dedupe for the two rotation kinds (refresh and legacy upgrade).
 * Subclasses ({@link FireflySessionWeb}, {@link FireflySessionNative}) provide
 * the environment-specific token source via {@link getAccessToken},
 * {@link rotate}, and (optionally) {@link upgrade}.
 */
export abstract class FireflySession {
    /** In-flight refresh, so concurrent callers in this instance share one rotation. */
    private refreshPromise: Promise<string | null> | null = null;

    /** In-flight legacy→v3 upgrade, deduped independently of {@link refreshPromise}. */
    private upgradePromise: Promise<string | null> | null = null;

    private listeners = new Set<AccessTokenListener>();
    private lastNotified: string | null = null;

    constructor(protected readonly ctx: AuthContext) {}

    /**
     * Resolve the freshest valid access token, refreshing proactively when it
     * is within the refresh window. Returns `null` when no session exists.
     */
    abstract getAccessToken(): Promise<string | null>;

    /**
     * Rotate the v3 token pair and return the new access token. Always invoked
     * through {@link refreshOnce} so concurrent callers share one rotation.
     */
    protected abstract rotate(): Promise<string | null>;

    /**
     * Upgrade a legacy session to a v3 token pair. Defaults to {@link rotate};
     * the web session overrides it with the legacy-token exchange.
     */
    protected upgrade(): Promise<string | null> {
        return this.rotate();
    }

    /**
     * Force a refresh now and return the new token. Call after a request fails
     * with 401 so the next attempt uses a freshly rotated token.
     */
    refresh(): Promise<string | null> {
        return this.refreshOnce();
    }

    /**
     * Subscribe to access-token changes (proactive refresh, 401 recovery, or a
     * cross-tab update). Returns an unsubscribe function.
     */
    subscribe(listener: AccessTokenListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /** Single-flight wrapper around {@link rotate}. */
    protected refreshOnce(): Promise<string | null> {
        this.refreshPromise ??= this.rotate().finally(() => {
            this.refreshPromise = null;
        });
        return this.refreshPromise;
    }

    /** Single-flight wrapper around {@link upgrade}. */
    protected upgradeOnce(): Promise<string | null> {
        this.upgradePromise ??= this.upgrade().finally(() => {
            this.upgradePromise = null;
        });
        return this.upgradePromise;
    }

    /** Notify subscribers when the freshest access token changes. */
    protected notify(accessToken: string | null): void {
        if (accessToken === this.lastNotified) return;
        this.lastNotified = accessToken;

        for (const listener of this.listeners) {
            try {
                listener(accessToken);
            } catch (error) {
                this.ctx.logger.error('Access-token listener threw', error);
            }
        }
    }
}
