import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';

import { getAccessTokenExpiresAt, shouldProactivelyRefresh } from '@/internal/jwt.js';
import { withTokenLock } from '@/internal/locks.js';
import { type FireflyTokenData, isUnauthorized, refreshFireflyToken } from '@/internal/refreshEndpoint.js';
import { FireflySession, TOKEN_LOCK } from '@/session/FireflySession.js';

/**
 * Native Firefly session (inside the Firefly app webview).
 *
 * Two modes, chosen by what the host build supports:
 *
 * - **`GET_REFRESH_TOKEN` available** (newer builds): obtain the refresh token
 *   from the bridge and maintain rotation in memory via the Firefly API. The
 *   access token is seeded cheaply from `GET_AUTHORIZATION` to skip the first
 *   round-trip; a 401 re-seeds the refresh token from the bridge once.
 * - **`GET_REFRESH_TOKEN` missing** (older builds): the package cannot refresh
 *   itself, so the host app owns token freshness — we simply ask for the current
 *   access token via `GET_AUTHORIZATION` whenever ours is near expiry.
 */
export class FireflySessionNative extends FireflySession {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private expiresAt = 0;

    /** Cached one-shot probe of whether the host supports `GET_REFRESH_TOKEN`. */
    private refreshTokenSupport: Promise<boolean> | null = null;

    override async getAccessToken(): Promise<string | null> {
        if (this.accessToken && !shouldProactivelyRefresh(this.expiresAt, this.ctx)) {
            return this.accessToken;
        }
        return this.refreshOnce();
    }

    protected override async rotate(): Promise<string | null> {
        // The `legacy` policy, or older builds without GET_REFRESH_TOKEN: the
        // host app owns token freshness, so just ask for the current token.
        if (this.ctx.config.policy === 'legacy' || !(await this.supportsRefreshToken())) {
            return this.refreshViaAuthorization();
        }
        return this.rotateViaRefreshToken();
    }

    /** Self-refresh flow: seed cheaply, then rotate under the cross-context lock. */
    private async rotateViaRefreshToken(): Promise<string | null> {
        // Cheap seed: adopt the app's current access token to skip the first
        // round-trip when it is still comfortably valid.
        if (!this.accessToken) {
            await this.refreshViaAuthorization();
            if (this.accessToken && !shouldProactivelyRefresh(this.expiresAt, this.ctx)) {
                return this.accessToken;
            }
        }

        return withTokenLock(TOKEN_LOCK, async () => {
            try {
                this.applyTokens(await this.rotateTokens());
                return this.accessToken;
            } catch (error) {
                // Refresh failed unexpectedly — fall back to the host's current token.
                this.ctx.logger.warn('Native token refresh failed; falling back to GET_AUTHORIZATION', error);
                return this.refreshViaAuthorization();
            }
        });
    }

    /** Ask the host for the current access token and adopt it. */
    private async refreshViaAuthorization(): Promise<string | null> {
        try {
            const token = await nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {});
            if (token) {
                this.accessToken = token;
                this.expiresAt = getAccessTokenExpiresAt(token, this.ctx.config.accessTokenTtlMs);
                this.notify(this.accessToken);
            }
        } catch (error) {
            this.ctx.logger.warn('GET_AUTHORIZATION failed', error);
        }

        return this.accessToken;
    }

    /**
     * Refresh with the cached (or bridge-seeded) refresh token. A 401 means our
     * cached token is stale — re-seed from the bridge once (the app may hold a
     * newer one) and retry.
     */
    private async rotateTokens(): Promise<FireflyTokenData> {
        this.refreshToken ??= await this.requestRefreshToken();

        try {
            return await refreshFireflyToken(this.refreshToken, this.ctx.config);
        } catch (error) {
            if (!isUnauthorized(error)) throw error;
            this.refreshToken = await this.requestRefreshToken();
            return refreshFireflyToken(this.refreshToken, this.ctx.config);
        }
    }

    private applyTokens(data: FireflyTokenData): void {
        this.accessToken = data.access_token_v3;
        this.refreshToken = data.refresh_token_v3;
        this.expiresAt = getAccessTokenExpiresAt(data.access_token_v3, this.ctx.config.accessTokenTtlMs);
        this.notify(this.accessToken);
    }

    private async requestRefreshToken(): Promise<string> {
        const token = await nativeBridgeProvider.request(SupportedMethod.GET_REFRESH_TOKEN, {});
        if (!token) throw new Error('Native bridge returned no refresh token.');
        return token;
    }

    /** Probe the host's supported methods once and cache the result. */
    private supportsRefreshToken(): Promise<boolean> {
        this.refreshTokenSupport ??= this.detectRefreshTokenSupport();
        return this.refreshTokenSupport;
    }

    private async detectRefreshTokenSupport(): Promise<boolean> {
        try {
            const methods = await nativeBridgeProvider.request(SupportedMethod.GET_SUPPORTED_METHODS, {});
            return Array.isArray(methods) && methods.includes(SupportedMethod.GET_REFRESH_TOKEN);
        } catch (error) {
            // Can't tell — assume unsupported and lean on GET_AUTHORIZATION.
            this.ctx.logger.warn('Failed to query native supported methods; assuming no refresh token', error);
            return false;
        }
    }
}
