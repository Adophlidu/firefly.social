/* cspell:disable */

import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from '@atproto/api';
import { memoize } from 'lodash-es';

import { PUBLIC_SERVICE_URL } from '@/constants/bsky.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { createBskyAgentAndResume } from '@/services/createBskyAgentAndResume.js';

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

    override async resumeSession(session: BskySession, refreshSession = true): Promise<void> {
        const agent = await createBskyAgentAndResume(session);
        if (this.session && agent.sessionManager.session) {
            this.session.sessionPayload = {
                ...this.session.sessionPayload,
                ...agent.sessionManager.session,
                pdsUrl: agent.sessionManager.pdsUrl?.toString(),
            };
        }

        if (refreshSession) {
            await agent.sessionManager.refreshSession();

            const now = Date.now();
            session.createdAt = now;
            session.expiresAt = now;
        }

        super.resumeSession(session);
        this._agent = agent;

        // update session payload
        if (this.session && agent.sessionManager.session && refreshSession) {
            this.session.sessionPayload = {
                ...this.session.sessionPayload,
                ...agent.sessionManager.session,
                pdsUrl: agent.sessionManager.pdsUrl?.toString(),
            };
        }
    }
}

export const bskySessionHolder = new BskySessionHolder();
