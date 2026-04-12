import type { FireflySession } from '@/providers/firefly/Session.js';
import type { Session } from '@/providers/types/Session.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

/**
 * force_restore only works for lens now,
 * means refresh token expired but force restore by re-login with privy
 */
type AccountOrigin = 'inherent' | 'sync' | 'force_restore' | 'signup';

export interface Account {
    origin?: AccountOrigin;
    profile: Profile;
    session: Session;
    fireflySession?: FireflySession;
}
