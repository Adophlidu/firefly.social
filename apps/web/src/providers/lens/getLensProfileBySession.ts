import { getLensProfileById } from '@/providers/lens/getLensProfileById.js';
import type { LensSession } from '@/providers/lens/Session.js';

export async function getLensProfileBySession(session: LensSession, signal?: AbortSignal) {
    const lensSession = session as LensSession;
    if (!lensSession.refreshToken) throw new Error('No refresh token found in given session');

    return getLensProfileById(lensSession.profileId);
}
