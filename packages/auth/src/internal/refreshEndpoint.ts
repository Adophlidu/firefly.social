import type { ResolvedConfig } from '#/config.js';

/** Shape of the Firefly v3 token-rotation response data. */
export interface FireflyTokenData {
    access_token_v3: string;
    refresh_token_v3: string;
    session_id: string;
}

interface FireflyResponse<T> {
    data?: T;
    error?: string | string[];
}

/** An HTTP error carrying the response status (used to detect 401s). */
export class HttpError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

/** A 401 from the API — the only failure a refresh re-seed can recover from. */
export function isUnauthorized(error: unknown): boolean {
    return error instanceof HttpError && error.status === 401;
}

function joinUrl(root: string, path: string): string {
    return `${root.replace(/\/$/, '')}${path}`;
}

function unwrap<T>(response: FireflyResponse<T>): T {
    if (response.error) {
        const message = Array.isArray(response.error) ? response.error[0] : response.error;
        throw new Error(message || 'Unknown Firefly API error');
    }
    if (!response.data) throw new Error('Firefly API returned an empty response');
    return response.data;
}

/**
 * Abort signal that fires after the configured request timeout, so a rotation
 * call can't hold the origin-wide lock indefinitely. `undefined` where
 * `AbortSignal.timeout` is unavailable (the request then runs without a timeout).
 */
function timeoutSignal(config: ResolvedConfig): AbortSignal | undefined {
    if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') return undefined;
    return AbortSignal.timeout(config.requestTimeoutMs);
}

/** Merge the configured extra headers under `base` (base wins), dropping undefined values. */
function buildHeaders(config: ResolvedConfig, base: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(config.headers)) {
        if (value !== undefined) headers[key] = value;
    }

    return { ...headers, ...base };
}

/**
 * Exchange a Firefly v3 refresh token for a fresh token pair via
 * `POST /v3/auth/refreshJWT`.  The refresh token is single-use and rotated:
 * the response carries the next one.
 */
export async function refreshFireflyToken(refreshToken: string, config: ResolvedConfig): Promise<FireflyTokenData> {
    const url = joinUrl(config.fireflyRootUrl, '/v3/auth/refreshJWT');
    const res = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(config, { 'content-type': 'application/json' }),
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: timeoutSignal(config),
    });
    if (!res.ok) throw new HttpError(`refreshJWT failed: ${res.status}`, res.status);
    return unwrap((await res.json()) as FireflyResponse<FireflyTokenData>);
}

/**
 * Exchange a legacy v1 bearer token for a v3 token pair via
 * `POST /v3/auth/exchangeLegacyJWT`.  Used to seamlessly upgrade legacy-only
 * sessions so they too can be refreshed going forward.
 */
export async function exchangeLegacyFireflyToken(
    legacyToken: string,
    config: ResolvedConfig,
): Promise<FireflyTokenData> {
    const url = joinUrl(config.fireflyRootUrl, '/v3/auth/exchangeLegacyJWT');
    const res = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(config, { Authorization: `Bearer ${legacyToken}` }),
        signal: timeoutSignal(config),
    });
    if (!res.ok) throw new HttpError(`exchangeLegacyJWT failed: ${res.status}`, res.status);
    return unwrap((await res.json()) as FireflyResponse<FireflyTokenData>);
}
