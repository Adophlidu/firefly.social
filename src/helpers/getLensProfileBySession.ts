import { createLensSDKForSession, MemoryStorageProvider } from '@/helpers/createLensSDK.js';
import { refreshLensSession } from '@/helpers/refreshLensSession.js';
import { LensSession } from '@/providers/lens/Session.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function getLensProfileBySession(session: LensSession, signal?: AbortSignal) {
    const lensSession = session as LensSession;
    if (!lensSession.refreshToken) throw new Error('No refresh token found in given session');

    const sdk = createLensSDKForSession(new MemoryStorageProvider(), lensSession);

    const profileIdFirstTry = await sdk.authentication.getProfileId();
    if (!profileIdFirstTry) {
        // refresh lens session and try again
        await refreshLensSession(sdk);

        const profileIdSecondTry = await sdk.authentication.getProfileId();
        if (!profileIdSecondTry) throw new Error('Failed to get profile id from lens session');
    }

    return LensSocialMediaProvider.getProfileById(lensSession.profileId);
}
