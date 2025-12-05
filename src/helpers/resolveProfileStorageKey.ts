import { createLookupTableResolver } from '@dimensiondev/utils';

import { type ProfileSource, Source } from '@/constants/enum.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

const sessionTypeToProfileSource = createLookupTableResolver<SessionType, ProfileSource>(
    {
        [SessionType.Firefly]: Source.Firefly,
        [SessionType.Bsky]: Source.Bsky,
        [SessionType.Twitter]: Source.Twitter,
        [SessionType.Farcaster]: Source.Farcaster,
        [SessionType.Lens]: Source.Lens,
        [SessionType.Apple]: Source.Apple,
        [SessionType.Email]: Source.Email,
        [SessionType.Google]: Source.Google,
        [SessionType.Telegram]: Source.Telegram,
    },
    (sessionType) => {
        throw new Error(`Unknown session type: ${sessionType}`);
    },
);

export const resolveProfileStorageKey = createLookupTableResolver<ProfileSource, string>(
    {
        [Source.Firefly]: 'firefly-state',
        [Source.Bsky]: 'bsky-state',
        [Source.Twitter]: 'twitter-state',
        [Source.Farcaster]: 'farcaster-state',
        [Source.Lens]: 'lens-state',
        [Source.Apple]: 'third-party-state',
        [Source.Email]: 'third-party-state',
        [Source.Google]: 'third-party-state',
        [Source.Telegram]: 'third-party-state',
    },
    (source) => {
        throw new Error(`Unknown profile source: ${source}`);
    },
);

export function resolveProfileStorageKeyBySessionType(sessionType: SessionType): string {
    return resolveProfileStorageKey(sessionTypeToProfileSource(sessionType));
}
