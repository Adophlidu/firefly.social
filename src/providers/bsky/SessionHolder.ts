import { PUBLIC_SERVICE_URL } from '@/constants/bsky.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { createPublicBskyAgent, createSessionBskyAgent } from '@/providers/bsky/createBskyAgent.js';
import { BskySession } from '@/providers/bsky/Session.js';

class BskySessionHolder extends SessionHolder<BskySession> {
    private _agent = createPublicBskyAgent(PUBLIC_SERVICE_URL);

    get agent() {
        return this._agent;
    }

    override async resumeSession(session: BskySession, refreshSession = true): Promise<void> {
        this._agent = createSessionBskyAgent();

        super.resumeSession(session);
    }

    override removeSession(): void {
        this._agent = createPublicBskyAgent(PUBLIC_SERVICE_URL);

        super.removeSession();
    }
}

export const bskySessionHolder = new BskySessionHolder();
