import { bom, createLookupTableResolver } from '@dimensiondev/utils';
import { z } from 'zod';

import { type SocialSource, Source } from '@/constants/enum.js';
import { SessionFactory } from '@/providers/base/SessionFactory.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import type { TwitterSession } from '@/providers/twitter/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

const Schema = z.object({
    state: z.object({
        currentProfileSession: z.string().nullable(),
    }),
});

type SessionTypes = {
    [SessionType.Bsky]: BskySession;
    [SessionType.Twitter]: TwitterSession;
    [SessionType.Lens]: LensSession;
    [SessionType.Farcaster]: FarcasterSession;
    [SessionType.Firefly]: FireflySession;
    [SessionType.Apple]: ThirdPartySession;
    [SessionType.Email]: ThirdPartySession;
    [SessionType.Google]: ThirdPartySession;
    [SessionType.Telegram]: ThirdPartySession;
};

const resolveStorageKey = createLookupTableResolver<SessionType, string>(
    {
        [SessionType.Bsky]: 'bsky-state',
        [SessionType.Twitter]: 'twitter-state',
        [SessionType.Farcaster]: 'farcaster-state',
        [SessionType.Lens]: 'lens-state',
        [SessionType.Firefly]: 'firefly-state',
        [SessionType.Apple]: 'third-party-state',
        [SessionType.Email]: 'third-party-state',
        [SessionType.Google]: 'third-party-state',
        [SessionType.Telegram]: 'third-party-state',
    },
    (sessionType) => {
        throw new Error(`Unknown session type: ${sessionType}`);
    },
);

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

    const state = bom.localStorage.getItem(resolveStorageKey(sessionType));
    if (!state) return null;

    const parsed = Schema.safeParse(JSON.parse(state));
    if (!parsed.success) {
        console.error('Failed to parse session state from storage', parsed.error);
        return null;
    }

    // No session found
    if (!parsed.data.state.currentProfileSession) return null;

    try {
        const session = SessionFactory.createSession(parsed.data.state.currentProfileSession);
        return session as SessionTypes[typeof sessionType];
    } catch (error) {
        console.error(`Failed to create session from storage for type ${sessionType}:`, error);
        return null;
    }
}

export function getSessionFromStorageBySource(source: SocialSource) {
    return getSessionFromStorage(resolveStorageKeyBySource(source));
}
