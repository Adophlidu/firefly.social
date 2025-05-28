/* cspell:disable */

import { PUBLIC_SERVICE_URL } from '@/constants/bsky.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { createAgentOnce } from '@/providers/bsky/createBskyAgent.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { createBskyAgentAndResume } from '@/services/createBskyAgentAndResume.js';

class BskySessionHolder extends SessionHolder<BskySession> {
    private _agent = createAgentOnce(PUBLIC_SERVICE_URL);

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
