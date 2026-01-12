import { PUBLIC_SERVICE_URL } from '@/constants/bsky.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { createBskyPublicAgent, createBskySessionAgent } from '@/providers/bsky/createBskyAgent.js';
import { type BskySession } from '@/providers/bsky/Session.js';

class BskySessionHolder extends SessionHolder<BskySession> {
    private _agent = createBskyPublicAgent(PUBLIC_SERVICE_URL);

    get agent() {
        return this._agent;
    }

    override async resumeSession(session: BskySession): Promise<void> {
        this._agent = createBskySessionAgent();

        super.resumeSession(session);
    }

    override removeSession(): void {
        this._agent = createBskyPublicAgent(PUBLIC_SERVICE_URL);

        super.removeSession();
    }
}

export const bskySessionHolder = new BskySessionHolder();
