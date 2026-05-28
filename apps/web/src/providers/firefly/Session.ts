import { IS_PRODUCTION } from '@dimensiondev/constants';
import { SessionType } from '@dimensiondev/enums';
import { NotAllowedError, parseJson } from '@dimensiondev/utils';
import { z } from 'zod';

import { encodeAsciiPayload, encodeNoAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { logger } from '@/libs/Logger.js';
import { BaseSession } from '@/providers/base/Session.js';
import type { Session } from '@/providers/types/Session.js';
import { refreshFireflyToken } from '@/services/refreshFireflyToken.js';

export const FireflySessionSignature = z.object({
    address: z.string(),
    message: z.string(),
    signature: z.string(),
});

export const FireflySessionPayload = z.object({
    /**
     * indicate a new firefly binding when it was created
     */
    isNew: z.boolean().optional(),

    /**
     * numeric user ID
     */
    uid: z.string().optional(),
    /**
     * UUID of the user
     */
    accountId: z.string().optional(),
    avatar: z.string().nullish().optional(),
    displayName: z.string().nullish().optional(),
});

/**
 * JWT-related token data stored alongside the session.
 * `accessToken` is the legacy v1 token kept for backward-compat; it will be
 * removed once the backend closes the compat window.
 */
export const FireflyJwtPayload = z.object({
    /** Firefly JWT v3 access token (1h TTL). Primary auth token for all users. */
    accessToken: z.string().optional(),
    /** Firefly JWT v3 refresh token (7d TTL, rotated on use). */
    refreshToken: z.string().optional(),
    /** Session ID for client-side tracking. Not used in auth headers. */
    sessionId: z.string().optional(),
});

/** Decoded body of a Firefly JWT v3 access token. */
const FireflyAccessTokenPayload = z.object({
    account_id: z.string().optional(),
    account_raw_id: z.number().optional(),
    sub: z.string().optional(),
    session_id: z.string().optional(),
    token_type: z.string().optional(),
    issued_at_ms: z.number(),
});

/** Firefly JWT v3 access token TTL in milliseconds. */
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Decodes the `issued_at_ms` field from a Firefly JWT v3 access token and
 * returns the absolute expiry timestamp (ms).  Returns 0 for legacy tokens
 * that don't carry this field.
 */
function getAccessTokenExpiresAt(accessToken: string): number {
    // JWT structure: <header>.<payload>.<signature>  (base64url encoded)
    const base64url = accessToken.split('.')[1];
    if (!base64url) return 0;

    const json = parseJson(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')));
    if (!IS_PRODUCTION) logger.info('[FireflySession] Decoding JWT access token payload', json);

    const result = FireflyAccessTokenPayload.safeParse(json);
    if (result.success) {
        return result.data.issued_at_ms + ACCESS_TOKEN_TTL_MS;
    } else {
        logger.error('[FireflySession] Failed to decode JWT expiry', result.error.message);
        return 0;
    }
}

export class FireflySession extends BaseSession implements Session {
    constructor(
        accountId: string,
        accessToken: string,
        public parent: Session | null,
        public signature: z.infer<typeof FireflySessionSignature> | null,
        /**
         * @deprecated
         * This field always false. Use `payload.isNew` instead
         */
        public isNew?: boolean,
        public payload?: z.infer<typeof FireflySessionPayload>,
        public jwtPayload?: z.infer<typeof FireflyJwtPayload>,
    ) {
        // expiresAt is derived from the v3 access token (carries issued_at_ms).
        // session.token holds the legacy v1 token and is read-only going forward.
        super(
            SessionType.Firefly,
            accountId,
            accessToken,
            Date.now(),
            getAccessTokenExpiresAt(jwtPayload?.accessToken ?? ''),
        );
    }

    /**
     * For users after this patch use accountId in UUID format for events.
     * For legacy users use profileId in numeric format for events.
     */
    get accountIdForEvent() {
        return this.payload?.accountId ?? this.profileId;
    }

    override serialize(): `${SessionType}:${string}:${string}:${string}` {
        return [
            super.serialize(),
            // parent session
            this.parent ? btoa(this.parent.serialize()) : '',
            // signature if session created by signing a message
            this.signature ? encodeAsciiPayload(this.signature) : '',
            // isNew flag
            this.isNew ? '1' : '0',
            // extra data payload
            this.payload ? encodeNoAsciiPayload(this.payload) : '',
            // JWT token data (legacy accessToken + refresh token + session ID)
            this.jwtPayload ? encodeAsciiPayload(this.jwtPayload) : '',
        ].join(':') as `${SessionType}:${string}:${string}:${string}`;
    }

    override async refresh(): Promise<void> {
        if (!this.jwtPayload?.refreshToken) throw new Error('No refresh token available for this session.');
        const data = await refreshFireflyToken(this.jwtPayload.refreshToken);
        // Do NOT touch this.token — it holds the legacy v1 token and is read-only.
        // Only jwtPayload is updated with the newly rotated v3 token pair.
        this.expiresAt = getAccessTokenExpiresAt(data.access_token_v3);
        this.jwtPayload = {
            ...this.jwtPayload,
            accessToken: data.access_token_v3,
            refreshToken: data.refresh_token_v3,
            sessionId: data.session_id,
        };
    }

    override async destroy(): Promise<void> {
        throw new NotAllowedError();
    }
}
