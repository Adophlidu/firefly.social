import { ensureLensResult, ensureLensResultSync } from '@/providers/lens/ensureLensResult.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function getLensProfileBySession(session: LensSession, signal?: AbortSignal) {
    const lensSession = session as LensSession;
    if (!lensSession.refreshToken) throw new Error('No refresh token found in given session');

    const sdk = await ensureLensResult(lensSessionHolder.sdk.resumeSession());

    const profileIdFirstTry = ensureLensResultSync(sdk.getAuthenticatedUser()).address;
    if (!profileIdFirstTry) {
        // refresh lens session and try again
        await refreshLensSession(sdk);

        const profileIdSecondTry = ensureLensResultSync(sdk.getAuthenticatedUser()).address;
        if (!profileIdSecondTry) throw new Error('Failed to get profile id from lens session');
    }

    return LensSocialMediaProvider.getProfileById(lensSession.profileId);
}
