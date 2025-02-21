/* cspell:disable */

import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from '@atproto/api';
import { memoize } from 'lodash-es';

import { PUBLIC_SERVICE_URL } from '@/constants/bsky.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { BskySession } from '@/providers/bsky/Session.js';

export const createAgentOnce = (serviceUrl: string) => {
    return new AtpAgent({
        service: serviceUrl,
        persistSession: (evt: AtpSessionEvent, session?: AtpSessionData) => {
            console.warn('[AtpAgent] persistSession', evt, session);
        },
    });
};

export const createAgent: typeof createAgentOnce = memoize(createAgentOnce);

class BskySessionHolder extends SessionHolder<BskySession> {
    private _agent = createAgent(PUBLIC_SERVICE_URL);

    get agent() {
        return this._agent;
    }

    override async resumeSession(session: BskySession): Promise<void> {
        const agent =
            this._agent && this._agent?.serviceUrl.toString() === session.serviceUrl
                ? this._agent
                : createAgent(session.serviceUrl);

        await agent.resumeSession(session.sessionPayload);
        await agent.sessionManager.refreshSession();
        super.resumeSession(session);
        this._agent = agent;
    }
}

export const bskySessionHolder = new BskySessionHolder();
