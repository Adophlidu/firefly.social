import { type LensSession } from '@/providers/lens/Session.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function getLensProfileBySession(session: LensSession, signal?: AbortSignal) {
    const lensSession = session as LensSession;
    if (!lensSession.refreshToken) throw new Error('No refresh token found in given session');

    return lensSocialMediaProvider.getProfileById(lensSession.profileId);
}
