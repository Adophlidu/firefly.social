import type { AuthContext } from '#/internal/context.js';
import { getAccessTokenExpiresAt, shouldProactivelyRefresh } from '#/internal/jwt.js';
import { withTokenLock } from '#/internal/locks.js';
import { exchangeLegacyFireflyToken, type FireflyTokenData, refreshFireflyToken } from '#/internal/refreshEndpoint.js';
import { readFireflySnapshot, writeRotatedTokens } from '#/internal/storage.js';
import { FireflySession, TOKEN_LOCK } from '#/session/FireflySession.js';
import type { FireflySnapshot, JwtPayload } from '#/types.js';

/**
 * Web Firefly session: the shared `localStorage` (or a custom
 * {@link StorageAdapter}) is the source of truth.
 *
 * Tokens are refreshed before expiry, rotated under an origin-wide Web Lock so
 * concurrent tabs/sub-sites don't burn the single-use refresh token, and
 * written back so siblings adopt the rotated pair. Under the `auto` policy a
 * legacy-only session is upgraded to a v3 token pair on first use. A `storage`
 * listener propagates cross-tab login/logout/rotation to subscribers.
 */
export class FireflySessionWeb extends FireflySession {
    constructor(ctx: AuthContext) {
        super(ctx);
        this.bindStorageListener();
    }

    override async getAccessToken(): Promise<string | null> {
        const snapshot = readFireflySnapshot(this.ctx);
        if (!snapshot) return null;

        const { policy } = this.ctx.config;

        // `legacy`: only ever use the legacy access token, served as-is.
        if (policy === 'legacy') {
            const token = snapshot.legacyToken ?? null;
            this.notify(token);
            return token;
        }

        // `auto`: upgrade a legacy-only session to a v3 token pair first.
        if (policy === 'auto' && !snapshot.jwt?.accessToken && snapshot.legacyToken) {
            return this.upgradeOnce();
        }

        // `jwt` (and `auto` once a v3 token exists): use/refresh the v3 token.
        if (!snapshot.jwt?.accessToken) return null;

        // Rotate before expiry so no request ever leaves with a stale token.
        if (snapshot.jwt.refreshToken && shouldProactivelyRefresh(snapshot.expiresAt, this.ctx)) {
            return this.refreshOnce();
        }

        this.notify(snapshot.jwt.accessToken);
        return snapshot.jwt.accessToken;
    }

    /** Rotate the v3 token pair via the refresh token. */
    protected override rotate(): Promise<string | null> {
        return this.rotateExclusively((snapshot) => {
            if (!snapshot.jwt?.refreshToken) throw new Error('No refresh token available to rotate this session.');
            return refreshFireflyToken(snapshot.jwt.refreshToken, this.ctx.config);
        });
    }

    /** Exchange the legacy token for a v3 token pair. */
    protected override upgrade(): Promise<string | null> {
        return this.rotateExclusively((snapshot) => {
            if (!snapshot.legacyToken) throw new Error('No legacy token available to upgrade this session.');
            return exchangeLegacyFireflyToken(snapshot.legacyToken, this.ctx.config);
        });
    }

    /**
     * Run a rotation under the origin-wide lock. After acquiring it, adopt a
     * sibling tab/sub-site's already-rotated token (the single-use refresh token
     * would otherwise 401); otherwise rotate, persist, and notify. On failure,
     * fall back to whatever the storage currently holds.
     */
    private async rotateExclusively(
        rotate: (snapshot: FireflySnapshot) => Promise<FireflyTokenData>,
    ): Promise<string | null> {
        const before = readFireflySnapshot(this.ctx);
        if (!before) return null;

        const startedAccessToken = before.jwt?.accessToken;

        return withTokenLock(TOKEN_LOCK, async () => {
            const fresh = readFireflySnapshot(this.ctx);
            if (
                fresh?.jwt?.accessToken &&
                fresh.jwt.accessToken !== startedAccessToken &&
                fresh.profileId === before.profileId
            ) {
                this.notify(fresh.jwt.accessToken);
                return fresh.jwt.accessToken;
            }

            try {
                const data = await rotate(fresh ?? before);
                const jwt: JwtPayload = {
                    accessToken: data.access_token_v3,
                    refreshToken: data.refresh_token_v3,
                    sessionId: data.session_id,
                };
                const expiresAt = getAccessTokenExpiresAt(data.access_token_v3, this.ctx.config.accessTokenTtlMs);
                writeRotatedTokens(jwt, expiresAt, this.ctx);
                this.notify(data.access_token_v3);
                return data.access_token_v3;
            } catch (error) {
                this.ctx.logger.warn('Web token rotation failed', error);
                const fallback = readFireflySnapshot(this.ctx);
                const token = fallback?.jwt?.accessToken ?? fallback?.legacyToken ?? null;
                this.notify(token);
                return token;
            }
        });
    }

    /**
     * Listen for `firefly-state` changes from other tabs (login, logout, account
     * switch, or a sibling's rotation) and notify subscribers.
     */
    private bindStorageListener(): void {
        if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

        window.addEventListener('storage', (event) => {
            if (event.key !== this.ctx.config.storageKey) return;
            const snapshot = readFireflySnapshot(this.ctx);
            this.notify(snapshot?.jwt?.accessToken ?? snapshot?.legacyToken ?? null);
        });
    }
}
