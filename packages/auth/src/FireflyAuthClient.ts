import { nativeBridgeProvider } from '@dimensiondev/native-bridge';

import { type FireflyAuthClientOptions, resolveConfig } from '#/config.js';
import type { AuthContext } from '#/internal/context.js';
import { createLogger } from '#/logger.js';
import type { FireflySession } from '#/session/FireflySession.js';
import { FireflySessionNative } from '#/session/FireflySessionNative.js';
import { FireflySessionWeb } from '#/session/FireflySessionWeb.js';
import type { AccessTokenListener } from '#/types.js';

/**
 * The Firefly session access-token provider for sub-sites hosted under
 * `firefly.social/*`.
 *
 * Construct one with your configuration and use it everywhere — it reads the
 * shared Firefly session, maintains JWT v3 token rotation itself, and exposes
 * only the freshest access token. The right strategy (web `localStorage` vs.
 * the native app bridge) is detected and applied internally.
 *
 * ```ts
 * const auth = new FireflyAuthClient();
 * const token = await auth.getAccessToken();
 * const unsubscribe = auth.subscribe((token) => { ... });
 * ```
 */
export class FireflyAuthClient {
    private readonly ctx: AuthContext;
    private session: FireflySession | null = null;

    constructor(options: FireflyAuthClientOptions = {}) {
        const config = resolveConfig(options);
        this.ctx = { config, logger: createLogger(config.debug) };
    }

    /**
     * Resolve the freshest valid access token, refreshing proactively when it
     * is within the refresh window. Returns `null` when no session exists.
     */
    getAccessToken(): Promise<string | null> {
        return this.resolveSession().getAccessToken();
    }

    /**
     * Force a refresh now and return the new token. Call after a request fails
     * with 401 so the next attempt uses a freshly rotated token.
     */
    refresh(): Promise<string | null> {
        return this.resolveSession().refresh();
    }

    /** Subscribe to access-token changes. Returns an unsubscribe function. */
    subscribe(listener: AccessTokenListener): () => void {
        return this.resolveSession().subscribe(listener);
    }

    /**
     * Lazily build the environment-specific session on first use. Detection is
     * deferred until called so it runs client-side (the native bridge isn't
     * present during SSR/module evaluation).
     */
    private resolveSession(): FireflySession {
        return (this.session ??= this.useNative()
            ? new FireflySessionNative(this.ctx)
            : new FireflySessionWeb(this.ctx));
    }

    /** Honour a forced `mode`, otherwise detect the host via the native bridge. */
    private useNative(): boolean {
        const { mode } = this.ctx.config;
        if (mode === 'native') return true;
        if (mode === 'web') return false;
        return nativeBridgeProvider.supported;
    }
}
