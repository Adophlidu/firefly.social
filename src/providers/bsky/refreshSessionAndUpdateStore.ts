import { isBskyTokenExpired } from '@/providers/bsky/isBskyTokenExpired.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';

export async function refreshSessionAndUpdateStore(force = false) {
    const currentProfileSession = useBskyProfileStore.getState().currentProfileSession;
    if (!currentProfileSession) {
        throw new Error('No current profile session found.');
    }

    const bskySession = currentProfileSession as BskySession;
    const { sessionPayload } = bskySession;
    if (!sessionPayload?.refreshJwt || !sessionPayload?.accessJwt) {
        throw new Error('Session payload is missing refreshJwt or accessJwt.');
    }

    if (isBskyTokenExpired(sessionPayload.accessJwt, 1000 * 60 * 3) || force) {
        await bskySessionHolder.resumeSession(bskySession, false);

        const newSessionPayload = bskySessionHolder.agent.sessionManager.session;
        if (!newSessionPayload) return;

        const profile = useBskyProfileStore.getState().currentProfile;
        if (!profile) return;

        const newBskySession = bskySession;
        newBskySession.sessionPayload = {
            ...sessionPayload,
            ...newSessionPayload,
        };
        useBskyProfileStore.getState().updateCurrentAccount({
            profile,
            session: newBskySession,
        });

        console.warn('[Bsky]: automatically refreshed session when posting');
    }
}
