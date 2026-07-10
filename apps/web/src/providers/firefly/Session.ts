import { getAccessTokenExpiresAt } from '@dimensiondev/auth';
import { SessionType } from '@dimensiondev/enums';
import { NotAllowedError, NotImplementedError } from '@dimensiondev/utils';
import { z } from 'zod';

import { encodeAsciiPayload, encodeNoAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { BaseSession } from '@/providers/base/Session.js';
import type { Session } from '@/providers/types/Session.js';

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
        public isNew: boolean,
        public payload: z.infer<typeof FireflySessionPayload> | null,
        public jwtPayload: z.infer<typeof FireflyJwtPayload> | null,
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
            this.payload?.isNew ? '1' : '0',
            // extra data payload
            this.payload ? encodeNoAsciiPayload(this.payload) : '',
            // JWT token data (legacy accessToken + refresh token + session ID)
            this.jwtPayload ? encodeAsciiPayload(this.jwtPayload) : '',
        ].join(':') as `${SessionType}:${string}:${string}:${string}`;
    }

    /**
     * Token rotation — refresh and legacy→v3 upgrade — is owned by
     * `@dimensiondev/auth` (`FireflyAuthClient`) via the session holder. This
     * stays only to satisfy the abstract {@link BaseSession} contract.
     */
    override refresh(): Promise<void> {
        throw new NotImplementedError();
    }

    override async destroy(): Promise<void> {
        throw new NotAllowedError();
    }
}
