import { NotAllowedError } from '@dimensiondev/utils';

import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { type ThirdPartySession } from '@/providers/third-party/Session.js';

class ThirdPartySessionHolder extends SessionHolder<ThirdPartySession> {
    override async resumeSession(session: ThirdPartySession) {
        this.internalSession = session;
    }

    override fetchWithSession<T>(url: string, init?: RequestInit): Promise<T> {
        throw new NotAllowedError();
    }

    override fetchWithoutSession<T>(url: string, init?: RequestInit): Promise<T> {
        throw new NotAllowedError();
    }

    override removeSession(): void {
        this.session?.destroy();
        super.removeSession();
    }
}

export const thirdPartySessionHolder = new ThirdPartySessionHolder();
