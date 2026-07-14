import { parseJson } from '@dimensiondev/utils';

import type { AuthContext } from '#/internal/context.js';

/** Default Firefly JWT v3 access-token TTL (ms). The token carries `issued_at_ms`. */
export const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Decode the `issued_at_ms` claim from a Firefly JWT v3 access token and return
 * its absolute expiry timestamp (ms epoch).
 *
 * Returns `0` for tokens that don't carry the claim (e.g. legacy v1 tokens), so
 * callers treat expiry as "unknown". Exported for consumers that persist Firefly
 * sessions themselves and need to stamp the same expiry the package reads back.
 */
export function getAccessTokenExpiresAt(accessToken: string, ttlMs: number = DEFAULT_ACCESS_TOKEN_TTL_MS): number {
    // JWT structure: <header>.<payload>.<signature>, each base64url-encoded.
    const base64url = accessToken.split('.')[1];
    if (!base64url) return 0;

    try {
        const json = parseJson<{ issued_at_ms?: unknown }>(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')));
        if (json && typeof json.issued_at_ms === 'number') return json.issued_at_ms + ttlMs;
        return 0;
    } catch {
        return 0;
    }
}

/** Whether `expiresAt` is known and within the proactive-refresh window. */
export function shouldProactivelyRefresh(expiresAt: number, ctx: AuthContext): boolean {
    if (expiresAt <= 0) return false;
    return Date.now() > expiresAt - ctx.config.proactiveRefreshThresholdMs;
}
