import { unreachable } from '@dimensiondev/utils';

import { ensureBskySessionIsValid } from '@/providers/bsky/ensureBskySessionIsValid.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { ensureLensSessionIsValid } from '@/providers/lens/ensureLensSessionIsValid.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { type Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export async function ensureSessionIsValid(session: Session) {
    switch (session.type) {
        case SessionType.Bsky:
            return ensureBskySessionIsValid(session as BskySession);
        case SessionType.Lens:
            return ensureLensSessionIsValid(session as LensSession);
        case SessionType.Farcaster:
        case SessionType.Twitter:
        case SessionType.Firefly:
        case SessionType.Apple:
        case SessionType.Google:
        case SessionType.Telegram:
        case SessionType.Email:
            return session;
        default:
            throw unreachable(session.type);
    }
}
