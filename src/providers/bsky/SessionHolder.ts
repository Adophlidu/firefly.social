/* cspell:disable */

import { AtpAgent } from '@atproto/api';

import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { NotImplementedError } from '@/constants/error.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { BskySession } from '@/providers/bsky/Session.js';

class BskySessionHolder extends SessionHolder<BskySession> {
    private _agent: AtpAgent | null = null;

    get agent() {
        if (!this._agent) {
            this._agent = new AtpAgent({
                service: DEFAULT_SERVICE_URL,
            });
        }
        return this._agent;
    }

    override resumeSession(session: BskySession): void {
        throw new NotImplementedError();
    }
}

export const bskySessionHolder = new BskySessionHolder();
