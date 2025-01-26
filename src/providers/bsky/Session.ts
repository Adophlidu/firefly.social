/* cspell:disable */

import type { AtpSessionData } from '@atproto/api';

import { NotAllowedError } from '@/constants/error.js';
import { BaseSession } from '@/providers/base/Session.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export class BskySession extends BaseSession implements Session {
    constructor(
        public did: string,
        public refreshJwt: string,
        createdAt: number,
        expiresAt: number,
        public serviceUrl: string,
        public sessionPayload: AtpSessionData,
    ) {
        super(SessionType.Bsky, did, refreshJwt, createdAt, expiresAt);
    }

    override serialize(): `${SessionType}:${string}` {
        return `${super.serialize()}:${this.serviceUrl}:${btoa(JSON.stringify(this.sessionPayload))}`;
    }

    override refresh(): Promise<void> {
        throw new NotAllowedError('The session is maintained by the bsky SDK.');
    }

    override async destroy(): Promise<void> {
        throw new NotAllowedError('The session is maintained by the bsky SDK.');
    }
}
