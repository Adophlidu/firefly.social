/* cspell:disable */

import { NotAllowedError } from '@/constants/error.js';
import { BaseSession } from '@/providers/base/Session.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export class BskySession extends BaseSession implements Session {
    constructor(profileId: string, token: string, createdAt: number, expiresAt: number) {
        super(SessionType.Bsky, profileId, token, createdAt, expiresAt);
    }

    override serialize(): `${SessionType}:${string}` {
        return super.serialize();
    }

    override refresh(): Promise<void> {
        throw new NotAllowedError();
    }

    override async destroy(): Promise<void> {
        throw new NotAllowedError();
    }
}
