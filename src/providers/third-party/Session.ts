import { signOut } from 'next-auth/react';

import { NotAllowedError } from '@/constants/error.js';
import { encodeAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { BaseSession } from '@/providers/base/Session.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export interface ThirdPartySessionPayload {
    // firefly profile
    accessToken?: string;
    accountId?: string;
    isNew?: boolean;
    uid?: string;
    avatar?: string | null;
    displayName?: string | null;

    // only for apple & google
    nonce?: string;

    // only for email
    email?: string;
    passcode?: string;

    // only for telegram
    telegram_username?: string;
    telegram_user_id?: string;
}

export class ThirdPartySession extends BaseSession implements Session {
    constructor(
        type: SessionType.Apple | SessionType.Google | SessionType.Telegram | SessionType.Email,
        profileId: string,
        token: string,
        createdAt: number,
        expiresAt: number,
        public payload?: ThirdPartySessionPayload,
    ) {
        super(type, profileId, token, createdAt, expiresAt);
    }

    override serialize(): `${SessionType}:${string}` {
        return `${super.serialize()}:${encodeAsciiPayload(this.payload ?? {})}`;
    }

    override refresh(): Promise<void> {
        throw new NotAllowedError();
    }

    override async destroy(): Promise<void> {
        await signOut();
    }
}
