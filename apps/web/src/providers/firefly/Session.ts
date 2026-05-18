import { SessionType } from '@dimensiondev/enums';
import { NotAllowedError } from '@dimensiondev/utils';
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
    ) {
        super(SessionType.Firefly, accountId, accessToken, 0, 0);
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
        ].join(':') as `${SessionType}:${string}:${string}:${string}`;
    }

    override async refresh(): Promise<void> {
        throw new NotAllowedError();
    }

    override async destroy(): Promise<void> {
        throw new NotAllowedError();
    }
}
