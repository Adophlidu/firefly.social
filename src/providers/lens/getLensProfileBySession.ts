import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function getLensProfileBySession(session: LensSession, signal?: AbortSignal) {
    const lensSession = session as LensSession;
    if (!lensSession.refreshToken) throw new Error('No refresh token found in given session');

    const client = await ensureLensResult(lensClientHolder.client.resumeSession());
    const profileIdFirstTry = ensureLensResultSync(client.getAuthenticatedUser()).address;
    if (!profileIdFirstTry) {
        // refresh lens session and try again
        await refreshLensSession(client);

        const profileIdSecondTry = ensureLensResultSync(client.getAuthenticatedUser()).address;
        if (!profileIdSecondTry) throw new Error('Failed to get profile id from lens session');
    }
    return lensSocialMediaProvider.getProfileById(lensSession.profileId);
}
