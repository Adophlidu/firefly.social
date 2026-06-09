import type { AuthContext } from '@/internal/context.js';
import { getAccessTokenExpiresAt, shouldProactivelyRefresh } from '@/internal/jwt.js';
import { withTokenLock } from '@/internal/locks.js';
import { exchangeLegacyFireflyToken, type FireflyTokenData, refreshFireflyToken } from '@/internal/refreshEndpoint.js';
import { readFireflySnapshot, writeRotatedTokens } from '@/internal/storage.js';
import { FireflySession, TOKEN_LOCK } from '@/session/FireflySession.js';
import type { FireflySnapshot, JwtPayload } from '@/types.js';

/**
 * Web Firefly session: the shared `localStorage` (or a custom
 * {@link StorageAdapter}) is the source of truth.
 *
 * Tokens are refreshed before expiry, rotated under an origin-wide Web Lock so
 * concurrent tabs/sub-sites don't burn the single-use refresh token, and
 * written back so siblings adopt the rotated pair. Legacy-only sessions are
 * upgraded to a v3 token pair on first use. A `storage` listener propagates
 * cross-tab login/logout/rotation to subscribers.
 */
export class FireflySessionWeb extends FireflySession {
    constructor(ctx: AuthContext) {
        super(ctx);
        this.bindStorageListener();
    }

    override async getAccessToken(): Promise<string | null> {
        const snapshot = readFireflySnapshot(this.ctx);
        if (!snapshot) return null;

        // Legacy-only session: upgrade to a v3 token pair so it can be refreshed.
        if (!snapshot.jwt?.accessToken && snapshot.legacyToken) {
            return this.refreshOnce();
        }

        // Rotate before expiry so no request ever leaves with a stale token.
        if (snapshot.jwt?.refreshToken && shouldProactivelyRefresh(snapshot.expiresAt, this.ctx)) {
            return this.refreshOnce();
        }

        const token = snapshot.jwt?.accessToken ?? snapshot.legacyToken ?? null;
        this.notify(token);
        return token;
    }

    protected override async rotate(): Promise<string | null> {
        const before = readFireflySnapshot(this.ctx);
        if (!before) return null;

        const startedAccessToken = before.jwt?.accessToken;

        return withTokenLock(TOKEN_LOCK, async () => {
            // A sibling tab/sub-site may have rotated while we waited for the lock.
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
                const data = await this.rotateTokens(fresh ?? before);
                const jwt: JwtPayload = {
                    accessToken: data.access_token_v3,
                    refreshToken: data.refresh_token_v3,
                    sessionId: data.session_id,
                };
                const expiresAt = getAccessTokenExpiresAt(data.access_token_v3, this.ctx);
                writeRotatedTokens(jwt, expiresAt, this.ctx);
                this.notify(data.access_token_v3);
                return data.access_token_v3;
            } catch (error) {
                this.ctx.logger.warn('Web token refresh failed', error);
                // Fall back to whatever the storage currently holds.
                const fallback = readFireflySnapshot(this.ctx);
                const token = fallback?.jwt?.accessToken ?? fallback?.legacyToken ?? null;
                this.notify(token);
                return token;
            }
        });
    }

    /** Rotate via the refresh token, or upgrade a legacy-only session. */
    private rotateTokens(snapshot: FireflySnapshot): Promise<FireflyTokenData> {
        if (snapshot.jwt?.refreshToken) return refreshFireflyToken(snapshot.jwt.refreshToken, this.ctx.config);
        if (snapshot.legacyToken) return exchangeLegacyFireflyToken(snapshot.legacyToken, this.ctx.config);
        throw new Error('No refresh or legacy token available to rotate this session.');
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
