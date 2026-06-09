import type { AuthContext } from '@/internal/context.js';
import type { AccessTokenListener } from '@/types.js';

/** Origin-wide lock name that serializes JWT rotation across tabs and sub-sites. */
export const TOKEN_LOCK = 'firefly:jwt:token';

/**
 * Abstract Firefly session: owns the access-token concern and exposes only the
 * freshest token to consumers.
 *
 * Shared, environment-agnostic machinery lives here — subscriber fan-out and
 * single-flight refresh dedupe. Subclasses ({@link FireflySessionWeb},
 * {@link FireflySessionNative}) provide the environment-specific token source
 * via {@link getAccessToken} and {@link rotate}.
 */
export abstract class FireflySession {
    /** In-tab refresh dedupe: concurrent callers await a single rotation. */
    private refreshPromise: Promise<string | null> | null = null;

    private listeners = new Set<AccessTokenListener>();
    private lastNotified: string | null = null;

    constructor(protected readonly ctx: AuthContext) {}

    /**
     * Resolve the freshest valid access token, refreshing proactively when it
     * is within the refresh window. Returns `null` when no session exists.
     */
    abstract getAccessToken(): Promise<string | null>;

    /**
     * Perform an actual token rotation and return the new access token. Always
     * invoked through {@link refreshOnce} so concurrent callers share a single
     * in-flight rotation.
     */
    protected abstract rotate(): Promise<string | null>;

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
