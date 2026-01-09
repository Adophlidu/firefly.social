import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { createLensPublicClient, createLensSessionClient } from '@/providers/lens/createLensClient.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { type LensSession } from '@/providers/lens/Session.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

class LensSessionHolder extends SessionHolder<LensSession> {
    override assertSession(message?: string): LensSession {
        throw new Error('The Lens session holder does not maintain an internal session, yet the Lens client does.');
    }

    override async refreshSession() {
        const currentSession = useLensProfileStore.getState().currentProfileSession;
        if (!currentSession) throw new Error('No current session found.');

        return refreshLensSession(currentSession as LensSession);
    }

    override async resumeSession(session: LensSession, refreshSession = false) {
        const lensClient = createLensSessionClient();
        const sessionClient = await ensureLensResult(lensClient.resumeSession());

        lensClientHolder.setClient(lensClient);
        lensSessionClientHolder.setSessionClient(sessionClient);

        super.resumeSession(session);
    }

    override removeSession(): void {
        lensClientHolder.setClient(createLensPublicClient());
        lensSessionClientHolder.resetSessionClient();
        super.removeSession();
    }
}

export const lensSessionHolder = new LensSessionHolder();
