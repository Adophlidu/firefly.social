/* cspell:disable */

import { AtpAgent } from '@atproto/api';
import { memoize } from 'lodash-es';

import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { BskySession } from '@/providers/bsky/Session.js';

export const createAgent: (serviceUrl: string) => AtpAgent = memoize((serviceUrl: string) => {
    return new AtpAgent({
        service: serviceUrl,
        persistSession: (evt, session) => {
            console.log(evt, session);
        },
    });
});

class BskySessionHolder extends SessionHolder<BskySession> {
    get agent() {
        return createAgent(this.session?.serviceUrl ?? DEFAULT_SERVICE_URL);
    }

    override async resumeSession(session: BskySession): Promise<void> {
        await this.agent.sessionManager.resumeSession(session.sessionPayload);
        super.resumeSession(session);
    }
}

export const bskySessionHolder = new BskySessionHolder();
