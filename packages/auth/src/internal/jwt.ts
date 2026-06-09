import { parseJson } from '@dimensiondev/utils';

import type { AuthContext } from '@/internal/context.js';

/**
 * Decode the `issued_at_ms` claim from a Firefly JWT v3 access token and return
 * its absolute expiry timestamp (ms epoch).
 *
 * Returns `0` for tokens that don't carry the claim (e.g. legacy v1 tokens), so
 * callers treat expiry as "unknown" and lean on the 401-recovery path instead.
 */
export function getAccessTokenExpiresAt(accessToken: string, ctx: AuthContext): number {
    // JWT structure: <header>.<payload>.<signature>, each base64url-encoded.
    const base64url = accessToken.split('.')[1];
    if (!base64url) return 0;

    try {
        const json = parseJson<{ issued_at_ms?: unknown }>(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')));
        if (json && typeof json.issued_at_ms === 'number') {
            return json.issued_at_ms + ctx.config.accessTokenTtlMs;
        }
        return 0;
    } catch (error) {
        ctx.logger.error('Failed to decode JWT expiry', error);
        return 0;
    }
}

/** Whether `expiresAt` is known and within the proactive-refresh window. */
export function shouldProactivelyRefresh(expiresAt: number, ctx: AuthContext): boolean {
    if (expiresAt <= 0) return false;
    return Date.now() > expiresAt - ctx.config.proactiveRefreshThresholdMs;
}
