import type { SocialSource } from '@dimensiondev/enums';
import { SessionType, Source } from '@dimensiondev/enums';
import { bom, createLookupTableResolver, parseJson } from '@dimensiondev/utils';

import { resolveProfileStorageKeyBySessionType } from '@/helpers/resolveProfileStorageKey.js';
import { logger } from '@/libs/Logger.js';
import { SessionFactory } from '@/providers/base/SessionFactory.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import type { TwitterSession } from '@/providers/twitter/Session.js';
import { ProfileStoreSchema } from '@/schemas/ProfileStore.js';

interface SessionTypes {
    [SessionType.Bsky]: BskySession;
    [SessionType.Twitter]: TwitterSession;
    [SessionType.Lens]: LensSession;
    [SessionType.Farcaster]: FarcasterSession;
    [SessionType.Firefly]: FireflySession;
    [SessionType.Apple]: ThirdPartySession;
    [SessionType.Email]: ThirdPartySession;
    [SessionType.Google]: ThirdPartySession;
    [SessionType.Telegram]: ThirdPartySession;
}

const resolveStorageKeyBySource = createLookupTableResolver<SocialSource, SessionType>(
    {
        [Source.Bsky]: SessionType.Bsky,
        [Source.Twitter]: SessionType.Twitter,
        [Source.Farcaster]: SessionType.Farcaster,
        [Source.Lens]: SessionType.Lens,
    },
    (source) => {
        throw new Error(`Unknown source: ${source}`);
    },
);

export function getSessionFromStorage<T extends SessionType>(sessionType: T) {
    if (!bom.localStorage) return null;

    const state = bom.localStorage.getItem(resolveProfileStorageKeyBySessionType(sessionType));
    if (!state) return null;

    const parsed = ProfileStoreSchema.safeParse(parseJson(state));
    if (!parsed.success) {
        logger.error('Failed to parse session state from storage', parsed.error);
        return null;
    }

    // No session found
    if (!parsed.data.state.currentProfileSession) return null;

    try {
        const session = SessionFactory.createSession(parsed.data.state.currentProfileSession);
        return session as SessionTypes[typeof sessionType];
    } catch (error) {
        logger.error(`Failed to create session from storage for type ${sessionType}:`, error);
        return null;
    }
}

export function getSessionsFromStorage<T extends SessionType>(sessionType: T) {
    if (!bom.localStorage) return [];

    const state = bom.localStorage.getItem(resolveProfileStorageKeyBySessionType(sessionType));
    if (!state) return [];

    const parsed = ProfileStoreSchema.safeParse(parseJson(state));
    if (!parsed.success) {
        logger.error('Failed to parse session state from storage', parsed.error);
        return [];
    }

    // No sessions found
    if (parsed.data.state.accounts.length === 0) return [];

    try {
        return parsed.data.state.accounts.map((x) => SessionFactory.createSession(x.session)) as Array<
            SessionTypes[typeof sessionType]
        >;
    } catch (error) {
        logger.error(`Failed to create sessions from storage for type ${sessionType}:`, error);
        return [];
    }
}

export function getSessionFromStorageBySource(source: SocialSource) {
    return getSessionFromStorage(resolveStorageKeyBySource(source));
}

export function getSessionsFromStorageBySource(source: SocialSource) {
    return getSessionsFromStorage(resolveStorageKeyBySource(source));
}
