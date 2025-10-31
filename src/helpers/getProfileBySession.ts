import { safeUnreachable } from '@firefly/utils';

import { Source } from '@/constants/enum.js';
import { NotAllowedError, UnreachableError } from '@/constants/error.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

/**
 * Verify the session and return the profile.
 * @param session
 * @param signal
 * @returns
 */
export async function getProfileBySession(session: Session, signal?: AbortSignal) {
    switch (session.type) {
        case SessionType.Farcaster:
            const provider = resolveSocialMediaProvider(Source.Farcaster);
            return provider.getProfileBySession(session);
        case SessionType.Lens: {
            const provider = resolveSocialMediaProvider(Source.Lens);
            return provider.getProfileBySession(session);
        }
        case SessionType.Twitter: {
            const provider = resolveSocialMediaProvider(Source.Twitter);
            return provider.getProfileBySession(session);
        }
        case SessionType.Bsky: {
            const provider = resolveSocialMediaProvider(Source.Bsky);
            return provider.getProfileBySession(session);
        }
        case SessionType.Firefly:
            throw new NotAllowedError();
        case SessionType.Apple:
        case SessionType.Google:
        case SessionType.Telegram:
        case SessionType.Email:
            throw new NotAllowedError();
        default:
            safeUnreachable(session.type);
            throw new UnreachableError('session type', session);
    }
}
