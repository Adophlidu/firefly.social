/* cspell:disable */

import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from '@atproto/api';
import { memoize } from 'lodash-es';

import { PUBLIC_SERVICE_URL } from '@/constants/bsky.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { BskySession } from '@/providers/bsky/Session.js';

export const createAgent: (serviceUrl: string) => AtpAgent = memoize((serviceUrl: string) => {
    return new AtpAgent({
        service: serviceUrl,
        persistSession: (evt: AtpSessionEvent, session?: AtpSessionData) => {
            console.warn('[AtpAgent] persistSession', evt, session);
        },
    });
});

export function createPublicAgent() {
    return createAgent(PUBLIC_SERVICE_URL);
}

class BskySessionHolder extends SessionHolder<BskySession> {
    private _agent: AtpAgent | null = null;

    get agent() {
        if (!this.session) return createPublicAgent();

        if (!this._agent) throw new Error('Agent is not initialized');
        return this._agent;
    }

    override async resumeSession(session: BskySession): Promise<void> {
        const agent = createAgent(session.serviceUrl);
        await agent.resumeSession(session.sessionPayload);
        super.resumeSession(session);
        this._agent = agent;
    }
}

export const bskySessionHolder = new BskySessionHolder();
