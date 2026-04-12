/* cspell:disable */

import type { AtpSessionData } from '@atproto/api';
import { NotAllowedError } from '@dimensiondev/utils';

import { encodeAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { BaseSession } from '@/providers/base/Session.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

const BSKY_SESSION_PLACEHOLDER = '[BSKY_SESSION_PLACEHOLDER]';

type BskySessionPayload = AtpSessionData & {
    didDoc?: {};
    pdsUrl?: string;
};

export class BskySession extends BaseSession implements Session {
    constructor(
        public did: string,
        createdAt: number,
        expiresAt: number,
        public serviceUrl: string,
        public sessionPayload: BskySessionPayload,
    ) {
        super(SessionType.Bsky, did, BSKY_SESSION_PLACEHOLDER, createdAt, expiresAt);
    }

    override serialize(): `${SessionType}:${string}` {
        return `${super.serialize()}:${btoa(this.serviceUrl)}:${encodeAsciiPayload(this.sessionPayload)}`;
    }

    override refresh(): Promise<void> {
        throw new NotAllowedError('The session is maintained by the bsky SDK.');
    }

    override async destroy(): Promise<void> {
        throw new NotAllowedError('The session is maintained by the bsky SDK.');
    }
}
