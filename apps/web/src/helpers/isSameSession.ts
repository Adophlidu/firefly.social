import { SessionType } from '@dimensiondev/enums';
import { safeUnreachable, UnreachableError } from '@dimensiondev/utils';

import type { BskySession } from '@/providers/bsky/Session.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { TwitterSession } from '@/providers/twitter/Session.js';
import type { SessionPayload } from '@/providers/twitter/SessionPayload.js';
import type { Session } from '@/providers/types/Session.js';

export function isSameSession(session: Session | null, otherSession: Session | null, strict = false) {
    if (!session || !otherSession) return false;

    const checked = session.type === otherSession.type && session.profileId === otherSession.profileId;
    if (!strict) return checked;

    switch (session.type) {
        case SessionType.Farcaster:
            // compare private keys
            return (
                session.token === otherSession.token ||
                !!(session.profileId && otherSession.profileId && session.profileId === otherSession.profileId)
            );
        case SessionType.Lens:
            const lensSession = session as LensSession;
            const otherLensSession = otherSession as LensSession;
            return (
                lensSession.token === otherLensSession.token &&
                lensSession.refreshToken === otherLensSession.refreshToken
            );
        case SessionType.Twitter:
            const twitterSession = session as TwitterSession;
            const otherTwitterSession = otherSession as TwitterSession;
            return isSameTwitterSessionPayload(twitterSession.payload, otherTwitterSession.payload);
        case SessionType.Bsky:
            const bskySession = session as BskySession;
            const otherBskySession = otherSession as BskySession;
            return isSameBskySessionPayload(bskySession, otherBskySession);
        case SessionType.Firefly:
            return session.token === otherSession.token;

        // third party session types
        case SessionType.Apple:
        case SessionType.Google:
        case SessionType.Telegram:
        case SessionType.Email:
            return session.token === otherSession.token;
        default:
            safeUnreachable(session.type);
            throw new UnreachableError('session type', session);
    }
}

function isSameTwitterSessionPayload(
    sessionPayload?: SessionPayload | null,
    otherSessionPayload?: SessionPayload | null,
) {
    if (!sessionPayload || !otherSessionPayload) return false;
    return (
        sessionPayload.accessToken === otherSessionPayload.accessToken &&
        sessionPayload.accessTokenSecret === otherSessionPayload.accessTokenSecret
    );
}

function isSameBskySessionPayload(sessionPayload?: BskySession | null, otherSessionPayload?: BskySession | null) {
    if (!sessionPayload || !otherSessionPayload) return false;
    return (
        sessionPayload.sessionPayload.accessJwt === otherSessionPayload.sessionPayload.accessJwt &&
        sessionPayload.sessionPayload.refreshJwt === otherSessionPayload.sessionPayload.refreshJwt
    );
}
