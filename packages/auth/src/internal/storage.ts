import { parseJson } from '@dimensiondev/utils';

import { decodeAscii, encodeAscii } from '#/internal/codec.js';
import type { AuthContext } from '#/internal/context.js';
import type { FireflySnapshot, JwtPayload } from '#/types.js';

/** Session-type prefix every serialized Firefly session string starts with. */
const SESSION_TYPE = 'Firefly';

/** Segment index of the base64 JWT payload within a serialized Firefly session. */
const JWT_SEGMENT_INDEX = 6;

/** Decoded body (segment 1) of a serialized session string. */
interface SessionBody {
    type: string;
    token: string;
    profileId: string;
    createdAt: number;
    expiresAt: number;
}

/** Shape of the persisted Firefly profile store (only the fields we touch). */
interface ProfileStore {
    state?: {
        accounts?: Array<{ session?: unknown }>;
        currentProfileSession?: unknown;
    };
}

/**
 * Parse a serialized Firefly session string into a {@link FireflySnapshot}.
 *
 * Format: `Firefly:<b64 body>:<parent>:<signature>:<isNew>:<payload>:<b64 jwt>`.
 * Only the body (segment 1) and JWT payload (segment 6) are needed here.
 */
export function parseSessionString(raw: string): FireflySnapshot | null {
    const segments = raw.split(':');
    if (segments[0] !== SESSION_TYPE || !segments[1]) return null;

    const body = decodeAscii<SessionBody>(segments[1]);
    if (!body || typeof body.profileId !== 'string') return null;

    const jwtSegment = segments[JWT_SEGMENT_INDEX];
    const jwt = jwtSegment ? decodeAscii<JwtPayload>(jwtSegment) : null;

    return {
        profileId: body.profileId,
        legacyToken: body.token,
        expiresAt: typeof body.expiresAt === 'number' ? body.expiresAt : 0,
        jwt,
        raw,
    };
}

/** Read the current Firefly session from the configured storage, if any. */
export function readFireflySnapshot(ctx: AuthContext): FireflySnapshot | null {
    const { storage, storageKey } = ctx.config;
    if (!storage) return null;

    let stateStr: string | null;
    try {
        stateStr = storage.getItem(storageKey);
    } catch (error) {
        ctx.logger.error('Failed to read storage', error);
        return null;
    }

    if (!stateStr) return null;

    const store = parseJson<ProfileStore>(stateStr);
    const raw = store?.state?.currentProfileSession;
    if (typeof raw !== 'string') return null;

    return parseSessionString(raw);
}

/**
 * Replace the JWT payload (segment 6) and refresh `expiresAt` (in the body) of a
 * serialized session string, preserving every other segment untouched.
 */
function applyTokensToSessionString(raw: string, jwt: JwtPayload, expiresAt: number): string | null {
    const segments = raw.split(':');
    if (segments[0] !== SESSION_TYPE || !segments[1]) return null;

    const body = decodeAscii<SessionBody>(segments[1]);
    if (!body) return null;

    body.expiresAt = expiresAt;
    segments[1] = encodeAscii(body);

    // Pad so segment 6 exists even for sessions serialized without a JWT payload.
    while (segments.length <= JWT_SEGMENT_INDEX) segments.push('');

    segments[JWT_SEGMENT_INDEX] = encodeAscii(jwt);

    return segments.join(':');
}

/**
 * Persist a freshly rotated token pair back to storage so sibling tabs and
 * other `firefly.social/*` sub-sites adopt it instead of re-rotating (the
 * single-use refresh token would otherwise 401).
 *
 * Updates `currentProfileSession` and any account entry for the same profile.
 */
export function writeRotatedTokens(jwt: JwtPayload, expiresAt: number, ctx: AuthContext): void {
    const { storage, storageKey } = ctx.config;
    if (!storage) return;

    let stateStr: string | null;
    try {
        stateStr = storage.getItem(storageKey);
    } catch (error) {
        ctx.logger.error('Failed to read storage before write', error);
        return;
    }

    if (!stateStr) return;

    const store = parseJson<ProfileStore>(stateStr);
    const raw = store?.state?.currentProfileSession;
    if (!store?.state || typeof raw !== 'string') return;

    const updated = applyTokensToSessionString(raw, jwt, expiresAt);
    if (!updated) return;

    const current = parseSessionString(raw);
    store.state.currentProfileSession = updated;

    // Keep the matching account entry in sync with the rotated session.
    if (Array.isArray(store.state.accounts) && current) {
        store.state.accounts = store.state.accounts.map((account) => {
            if (typeof account.session !== 'string') return account;
            const parsed = parseSessionString(account.session);
            if (parsed && parsed.profileId === current.profileId) {
                return { ...account, session: updated };
            }
            return account;
        });
    }

    try {
        storage.setItem(storageKey, JSON.stringify(store));
    } catch (error) {
        ctx.logger.error('Failed to write rotated tokens to storage', error);
    }
}
